package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"pos-backend/internal/middleware"
	"pos-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrderHandler struct {
	db *sql.DB
}

func NewOrderHandler(db *sql.DB) *OrderHandler {
	return &OrderHandler{db: db}
}

// GetOrders retrieves all orders with pagination and filtering
func (h *OrderHandler) GetOrders(c *gin.Context) {
	// Parse query parameters
	page := 1
	perPage := 20
	status := c.Query("status")
	orderType := c.Query("order_type")

	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if perPageStr := c.Query("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}

	offset := (page - 1) * perPage

	// Build query with filters
	queryBuilder := `
		SELECT DISTINCT o.id, o.order_number, o.table_id, o.user_id, o.customer_name, 
		       o.order_type, o.status, o.subtotal, o.tax_amount, o.discount_amount, 
		       o.total_amount, o.notes, o.created_at, o.updated_at, o.served_at, o.completed_at,
		       t.table_number, t.location,
		       u.username, u.first_name, u.last_name
		FROM orders o
		LEFT JOIN dining_tables t ON o.table_id = t.id
		LEFT JOIN users u ON o.user_id = u.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 0

	if status != "" {
		argIndex++
		queryBuilder += fmt.Sprintf(" AND o.status = $%d", argIndex)
		args = append(args, status)
	}

	if orderType != "" {
		argIndex++
		queryBuilder += fmt.Sprintf(" AND o.order_type = $%d", argIndex)
		args = append(args, orderType)
	}

	// Count total records
	countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
	var total int
	if err := h.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to count orders",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add ordering and pagination
	argIndex++
	queryBuilder += fmt.Sprintf(" ORDER BY o.created_at DESC LIMIT $%d", argIndex)
	args = append(args, perPage)
	
	argIndex++
	queryBuilder += fmt.Sprintf(" OFFSET $%d", argIndex)
	args = append(args, offset)

	rows, err := h.db.Query(queryBuilder, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch orders",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		var tableNumber, tableLocation sql.NullString
		var username, firstName, lastName sql.NullString

		err := rows.Scan(
			&order.ID, &order.OrderNumber, &order.TableID, &order.UserID, &order.CustomerName,
			&order.OrderType, &order.Status, &order.Subtotal, &order.TaxAmount, &order.DiscountAmount,
			&order.TotalAmount, &order.Notes, &order.CreatedAt, &order.UpdatedAt, &order.ServedAt, &order.CompletedAt,
			&tableNumber, &tableLocation,
			&username, &firstName, &lastName,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan order",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Add table info if available
		if tableNumber.Valid {
			order.Table = &models.DiningTable{
				TableNumber: tableNumber.String,
				Location:    &tableLocation.String,
			}
		}

		// Add user info if available
		if username.Valid {
			order.User = &models.User{
				Username:  username.String,
				FirstName: firstName.String,
				LastName:  lastName.String,
			}
		}

		// Load order items
		if err := h.loadOrderItems(&order); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to load order items",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		orders = append(orders, order)
	}

	totalPages := (total + perPage - 1) / perPage

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Success: true,
		Message: "Orders retrieved successfully",
		Data:    orders,
		Meta: models.MetaData{
			CurrentPage: page,
			PerPage:     perPage,
			Total:       total,
			TotalPages:  totalPages,
		},
	})
}

// GetOrder retrieves a specific order by ID
func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	order, err := h.getOrderByID(orderID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Order not found",
			Error:   stringPtr("order_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch order",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Order retrieved successfully",
		Data:    order,
	})
}

// CreateOrder creates a new order
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Authentication required",
			Error:   stringPtr("auth_required"),
		})
		return
	}

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate request
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Order must contain at least one item",
			Error:   stringPtr("empty_order"),
		})
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to start transaction",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer tx.Rollback()

	// Generate order number
	orderNumber := h.generateOrderNumber()

	// Calculate totals
	var subtotal float64
	for _, item := range req.Items {
		// Get product price
		var price float64
		err := tx.QueryRow("SELECT price FROM products WHERE id = $1 AND is_available = true", item.ProductID).Scan(&price)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Message: "Product not found or not available",
				Error:   stringPtr("product_not_found"),
			})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to fetch product price",
				Error:   stringPtr(err.Error()),
			})
			return
		}
		subtotal += price * float64(item.Quantity)
	}

	// Calculate tax (10% for example)
	taxRate := 0.10
	taxAmount := subtotal * taxRate
	totalAmount := subtotal + taxAmount

	// Create order
	orderID := uuid.New()
	orderQuery := `
		INSERT INTO orders (id, order_number, table_id, user_id, customer_name, order_type, status, 
		                   subtotal, tax_amount, discount_amount, total_amount, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = tx.Exec(orderQuery, orderID, orderNumber, req.TableID, userID, req.CustomerName,
		req.OrderType, "pending", subtotal, taxAmount, 0, totalAmount, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create order",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Create order items
	for _, item := range req.Items {
		// Get product price again for consistency
		var price float64
		err := tx.QueryRow("SELECT price FROM products WHERE id = $1", item.ProductID).Scan(&price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to fetch product price",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		totalPrice := price * float64(item.Quantity)
		itemID := uuid.New()

		itemQuery := `
			INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, special_instructions)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = tx.Exec(itemQuery, itemID, orderID, item.ProductID, item.Quantity, price, totalPrice, item.SpecialInstructions)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to create order item",
				Error:   stringPtr(err.Error()),
			})
			return
		}
	}

	// Update table status if dine-in
	if req.OrderType == "dine_in" && req.TableID != nil {
		_, err = tx.Exec("UPDATE dining_tables SET is_occupied = true WHERE id = $1", *req.TableID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to update table status",
				Error:   stringPtr(err.Error()),
			})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to commit transaction",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Fetch and return the created order
	order, err := h.getOrderByID(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Order created but failed to fetch details",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Order created successfully",
		Data:    order,
	})
}

// UpdateOrderStatus updates the status of an order
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	userID, _, _, ok := middleware.GetUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Message: "Authentication required",
			Error:   stringPtr("auth_required"),
		})
		return
	}

	var req models.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"}
	isValidStatus := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid order status",
			Error:   stringPtr("invalid_status"),
		})
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to start transaction",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer tx.Rollback()

	// Get current order status
	var currentStatus string
	err = tx.QueryRow("SELECT status FROM orders WHERE id = $1", orderID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Order not found",
			Error:   stringPtr("order_not_found"),
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch current order status",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Update order status
	updateQuery := "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP"
	args := []interface{}{req.Status, orderID}

	// Set served_at or completed_at timestamps
	if req.Status == "served" {
		updateQuery += ", served_at = CURRENT_TIMESTAMP"
	} else if req.Status == "completed" {
		updateQuery += ", completed_at = CURRENT_TIMESTAMP"
	}

	updateQuery += " WHERE id = $2"

	_, err = tx.Exec(updateQuery, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to update order status",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Log status change in history
	historyQuery := `
		INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = tx.Exec(historyQuery, orderID, currentStatus, req.Status, userID, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to log status change",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// If order is completed or cancelled, free up the table
	if (req.Status == "completed" || req.Status == "cancelled") {
		_, err = tx.Exec(`
			UPDATE dining_tables 
			SET is_occupied = false 
			WHERE id IN (SELECT table_id FROM orders WHERE id = $1 AND table_id IS NOT NULL)
		`, orderID)
		if err != nil {
			// Log error but don't fail the transaction
			fmt.Printf("Warning: Failed to update table status: %v\n", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to commit transaction",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Fetch and return the updated order
	order, err := h.getOrderByID(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Order updated but failed to fetch details",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Order status updated successfully",
		Data:    order,
	})
}

// Helper functions

func (h *OrderHandler) getOrderByID(orderID uuid.UUID) (*models.Order, error) {
	var order models.Order
	var tableNumber, tableLocation sql.NullString
	var username, firstName, lastName sql.NullString

	query := `
		SELECT o.id, o.order_number, o.table_id, o.user_id, o.customer_name, 
		       o.order_type, o.status, o.subtotal, o.tax_amount, o.discount_amount, 
		       o.total_amount, o.notes, o.created_at, o.updated_at, o.served_at, o.completed_at,
		       t.table_number, t.location,
		       u.username, u.first_name, u.last_name
		FROM orders o
		LEFT JOIN dining_tables t ON o.table_id = t.id
		LEFT JOIN users u ON o.user_id = u.id
		WHERE o.id = $1
	`

	err := h.db.QueryRow(query, orderID).Scan(
		&order.ID, &order.OrderNumber, &order.TableID, &order.UserID, &order.CustomerName,
		&order.OrderType, &order.Status, &order.Subtotal, &order.TaxAmount, &order.DiscountAmount,
		&order.TotalAmount, &order.Notes, &order.CreatedAt, &order.UpdatedAt, &order.ServedAt, &order.CompletedAt,
		&tableNumber, &tableLocation,
		&username, &firstName, &lastName,
	)

	if err != nil {
		return nil, err
	}

	// Add table info if available
	if tableNumber.Valid {
		order.Table = &models.DiningTable{
			TableNumber: tableNumber.String,
			Location:    &tableLocation.String,
		}
	}

	// Add user info if available
	if username.Valid {
		order.User = &models.User{
			Username:  username.String,
			FirstName: firstName.String,
			LastName:  lastName.String,
		}
	}

	// Load order items
	if err := h.loadOrderItems(&order); err != nil {
		return nil, err
	}

	// Load payments
	if err := h.loadOrderPayments(&order); err != nil {
		return nil, err
	}

	return &order, nil
}

func (h *OrderHandler) loadOrderItems(order *models.Order) error {
	query := `
		SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price, 
		       oi.special_instructions, oi.status, oi.created_at, oi.updated_at,
		       p.name, p.description, p.price, p.preparation_time
		FROM order_items oi
		JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = $1
		ORDER BY oi.created_at
	`

	rows, err := h.db.Query(query, order.ID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		var productName, productDescription string
		var productPrice float64
		var preparationTime int

		err := rows.Scan(
			&item.ID, &item.ProductID, &item.Quantity, &item.UnitPrice, &item.TotalPrice,
			&item.SpecialInstructions, &item.Status, &item.CreatedAt, &item.UpdatedAt,
			&productName, &productDescription, &productPrice, &preparationTime,
		)
		if err != nil {
			return err
		}

		item.OrderID = order.ID
		item.Product = &models.Product{
			ID:              item.ProductID,
			Name:            productName,
			Description:     &productDescription,
			Price:           productPrice,
			PreparationTime: preparationTime,
		}

		items = append(items, item)
	}

	order.Items = items
	return nil
}

func (h *OrderHandler) loadOrderPayments(order *models.Order) error {
	query := `
		SELECT p.id, p.payment_method, p.amount, p.reference_number, p.status, 
		       p.processed_by, p.processed_at, p.created_at,
		       u.username, u.first_name, u.last_name
		FROM payments p
		LEFT JOIN users u ON p.processed_by = u.id
		WHERE p.order_id = $1
		ORDER BY p.created_at
	`

	rows, err := h.db.Query(query, order.ID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		var username, firstName, lastName sql.NullString

		err := rows.Scan(
			&payment.ID, &payment.PaymentMethod, &payment.Amount, &payment.ReferenceNumber,
			&payment.Status, &payment.ProcessedBy, &payment.ProcessedAt, &payment.CreatedAt,
			&username, &firstName, &lastName,
		)
		if err != nil {
			return err
		}

		payment.OrderID = order.ID

		// Add processed by user info if available
		if username.Valid {
			payment.ProcessedByUser = &models.User{
				Username:  username.String,
				FirstName: firstName.String,
				LastName:  lastName.String,
			}
		}

		payments = append(payments, payment)
	}

	order.Payments = payments
	return nil
}

func (h *OrderHandler) generateOrderNumber() string {
	timestamp := time.Now().Format("20060102")
	return fmt.Sprintf("ORD%s%04d", timestamp, time.Now().UnixNano()%10000)
}

