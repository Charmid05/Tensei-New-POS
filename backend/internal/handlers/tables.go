package handlers

import (
	"database/sql"
	"net/http"

	"pos-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TableHandler struct {
	db *sql.DB
}

func NewTableHandler(db *sql.DB) *TableHandler {
	return &TableHandler{db: db}
}

// GetTables retrieves all dining tables
func (h *TableHandler) GetTables(c *gin.Context) {
	location := c.Query("location")
	occupiedOnly := c.Query("occupied_only") == "true"
	availableOnly := c.Query("available_only") == "true"

	queryBuilder := `
		SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied, 
		       t.created_at, t.updated_at,
		       o.id as order_id, o.order_number, o.customer_name, o.status as order_status,
		       o.created_at as order_created_at, o.total_amount
		FROM dining_tables t
		LEFT JOIN orders o ON t.id = o.table_id AND o.status NOT IN ('completed', 'cancelled')
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 0

	if location != "" {
		argIndex++
		queryBuilder += ` AND t.location ILIKE $` + string(rune(argIndex+'0'))
		args = append(args, "%"+location+"%")
	}

	if occupiedOnly {
		queryBuilder += ` AND t.is_occupied = true`
	} else if availableOnly {
		queryBuilder += ` AND t.is_occupied = false`
	}

	queryBuilder += ` ORDER BY t.table_number ASC`

	rows, err := h.db.Query(queryBuilder, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch tables",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var tables []models.DiningTable
	for rows.Next() {
		var table models.DiningTable
		var orderID, orderNumber, customerName, orderStatus sql.NullString
		var orderCreatedAt sql.NullTime
		var totalAmount sql.NullFloat64

		err := rows.Scan(
			&table.ID, &table.TableNumber, &table.SeatingCapacity, &table.Location, &table.IsOccupied,
			&table.CreatedAt, &table.UpdatedAt,
			&orderID, &orderNumber, &customerName, &orderStatus, &orderCreatedAt, &totalAmount,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan table",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Create a map to hold table data including current order info
		tableData := map[string]interface{}{
			"id":               table.ID,
			"table_number":     table.TableNumber,
			"seating_capacity": table.SeatingCapacity,
			"location":         table.Location,
			"is_occupied":      table.IsOccupied,
			"created_at":       table.CreatedAt,
			"updated_at":       table.UpdatedAt,
			"current_order":    nil,
		}

		// Add current order info if available
		if orderID.Valid {
			tableData["current_order"] = map[string]interface{}{
				"id":            orderID.String,
				"order_number":  orderNumber.String,
				"customer_name": customerName.String,
				"status":        orderStatus.String,
				"created_at":    orderCreatedAt.Time,
				"total_amount":  totalAmount.Float64,
			}
		}

		// Convert to table struct for consistent response
		tables = append(tables, table)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Tables retrieved successfully",
		Data:    tables,
	})
}

// GetTable retrieves a specific table by ID
func (h *TableHandler) GetTable(c *gin.Context) {
	tableID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid table ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	var table models.DiningTable

	query := `
		SELECT id, table_number, seating_capacity, location, is_occupied, created_at, updated_at
		FROM dining_tables
		WHERE id = $1
	`

	err = h.db.QueryRow(query, tableID).Scan(
		&table.ID, &table.TableNumber, &table.SeatingCapacity, &table.Location,
		&table.IsOccupied, &table.CreatedAt, &table.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Table not found",
			Error:   stringPtr("table_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch table",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Get current active order for this table
	var currentOrder *models.Order
	orderQuery := `
		SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status, 
		       o.subtotal, o.tax_amount, o.total_amount, o.created_at, o.updated_at
		FROM orders o
		WHERE o.table_id = $1 AND o.status NOT IN ('completed', 'cancelled')
		ORDER BY o.created_at DESC
		LIMIT 1
	`

	var order models.Order
	err = h.db.QueryRow(orderQuery, tableID).Scan(
		&order.ID, &order.OrderNumber, &order.CustomerName, &order.OrderType, &order.Status,
		&order.Subtotal, &order.TaxAmount, &order.TotalAmount, &order.CreatedAt, &order.UpdatedAt,
	)

	if err == nil {
		currentOrder = &order
	} else if err != sql.ErrNoRows {
		// Log error but don't fail the request
		// fmt.Printf("Warning: Failed to fetch current order for table: %v\n", err)
	}

	// Create response with current order info
	response := map[string]interface{}{
		"id":               table.ID,
		"table_number":     table.TableNumber,
		"seating_capacity": table.SeatingCapacity,
		"location":         table.Location,
		"is_occupied":      table.IsOccupied,
		"created_at":       table.CreatedAt,
		"updated_at":       table.UpdatedAt,
		"current_order":    currentOrder,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Table retrieved successfully",
		Data:    response,
	})
}

// GetTablesByLocation retrieves tables grouped by location
func (h *TableHandler) GetTablesByLocation(c *gin.Context) {
	query := `
		SELECT t.id, t.table_number, t.seating_capacity, t.location, t.is_occupied, 
		       t.created_at, t.updated_at,
		       o.id as order_id, o.order_number, o.customer_name, o.status as order_status
		FROM dining_tables t
		LEFT JOIN orders o ON t.id = o.table_id AND o.status NOT IN ('completed', 'cancelled')
		ORDER BY t.location ASC, t.table_number ASC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch tables",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	// Group tables by location
	locationMap := make(map[string][]models.DiningTable)

	for rows.Next() {
		var table models.DiningTable
		var orderID, orderNumber, customerName, orderStatus sql.NullString
		var location sql.NullString

		err := rows.Scan(
			&table.ID, &table.TableNumber, &table.SeatingCapacity, &location, &table.IsOccupied,
			&table.CreatedAt, &table.UpdatedAt,
			&orderID, &orderNumber, &customerName, &orderStatus,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan table",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Set location
		if location.Valid {
			table.Location = &location.String
		} else {
			defaultLocation := "General"
			table.Location = &defaultLocation
		}

		locationKey := *table.Location
		locationMap[locationKey] = append(locationMap[locationKey], table)
	}

	// Convert map to structured response
	var locations []map[string]interface{}
	for locationName, tables := range locationMap {
		locations = append(locations, map[string]interface{}{
			"location": locationName,
			"tables":   tables,
		})
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Tables grouped by location retrieved successfully",
		Data:    locations,
	})
}

// GetTableStatus retrieves the status overview of all tables
func (h *TableHandler) GetTableStatus(c *gin.Context) {
	query := `
		SELECT 
		    COUNT(*) as total_tables,
		    COUNT(CASE WHEN is_occupied = true THEN 1 END) as occupied_tables,
		    COUNT(CASE WHEN is_occupied = false THEN 1 END) as available_tables,
		    COALESCE(location, 'General') as location
		FROM dining_tables
		GROUP BY COALESCE(location, 'General')
		ORDER BY location
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch table status",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var locationStats []map[string]interface{}
	var totalTables, totalOccupied, totalAvailable int

	for rows.Next() {
		var total, occupied, available int
		var location string

		err := rows.Scan(&total, &occupied, &available, &location)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan table status",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		locationStats = append(locationStats, map[string]interface{}{
			"location":         location,
			"total_tables":     total,
			"occupied_tables":  occupied,
			"available_tables": available,
			"occupancy_rate":   float64(occupied) / float64(total) * 100,
		})

		totalTables += total
		totalOccupied += occupied
		totalAvailable += available
	}

	response := map[string]interface{}{
		"total_tables":     totalTables,
		"occupied_tables":  totalOccupied,
		"available_tables": totalAvailable,
		"occupancy_rate":   float64(totalOccupied) / float64(totalTables) * 100,
		"by_location":      locationStats,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Table status retrieved successfully",
		Data:    response,
	})
}

