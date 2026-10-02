package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"pos-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProductHandler struct {
	db *sql.DB
}

func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

// GetProducts retrieves all products with pagination and filtering
func (h *ProductHandler) GetProducts(c *gin.Context) {
	// Parse query parameters
	page := 1
	perPage := 50
	categoryID := c.Query("category_id")
	available := c.Query("available")
	search := c.Query("search")

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
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 0

	if categoryID != "" {
		if _, err := uuid.Parse(categoryID); err == nil {
			argIndex++
			queryBuilder += ` AND p.category_id = $` + strconv.Itoa(argIndex)
			args = append(args, categoryID)
		}
	}

	if available == "true" {
		queryBuilder += ` AND p.is_available = true`
	} else if available == "false" {
		queryBuilder += ` AND p.is_available = false`
	}

	if search != "" {
		argIndex++
		queryBuilder += ` AND (p.name ILIKE $` + strconv.Itoa(argIndex) + ` OR p.description ILIKE $` + strconv.Itoa(argIndex) + `)`
		args = append(args, "%"+search+"%")
	}

	// Count total records
	countQuery := "SELECT COUNT(*) FROM (" + queryBuilder + ") as count_query"
	var total int
	if err := h.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to count products",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add ordering and pagination
	queryBuilder += ` ORDER BY p.sort_order ASC, p.name ASC`
	argIndex++
	queryBuilder += ` LIMIT $` + strconv.Itoa(argIndex)
	args = append(args, perPage)
	
	argIndex++
	queryBuilder += ` OFFSET $` + strconv.Itoa(argIndex)
	args = append(args, offset)

	rows, err := h.db.Query(queryBuilder, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch products",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		var categoryName, categoryColor sql.NullString

		err := rows.Scan(
			&product.ID, &product.CategoryID, &product.Name, &product.Description,
			&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
			&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
			&product.CreatedAt, &product.UpdatedAt,
			&categoryName, &categoryColor,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan product",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Add category info if available
		if categoryName.Valid {
			product.Category = &models.Category{
				ID:    *product.CategoryID,
				Name:  categoryName.String,
				Color: &categoryColor.String,
			}
		}

		products = append(products, product)
	}

	totalPages := (total + perPage - 1) / perPage

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Success: true,
		Message: "Products retrieved successfully",
		Data:    products,
		Meta: models.MetaData{
			CurrentPage: page,
			PerPage:     perPage,
			Total:       total,
			TotalPages:  totalPages,
		},
	})
}

// GetProduct retrieves a specific product by ID
func (h *ProductHandler) GetProduct(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid product ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	var product models.Product
	var categoryName, categoryColor sql.NullString

	query := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.id = $1
	`

	err = h.db.QueryRow(query, productID).Scan(
		&product.ID, &product.CategoryID, &product.Name, &product.Description,
		&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
		&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
		&product.CreatedAt, &product.UpdatedAt,
		&categoryName, &categoryColor,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Product not found",
			Error:   stringPtr("product_not_found"),
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch product",
			Error:   stringPtr(err.Error()),
		})
		return
	}

	// Add category info if available
	if categoryName.Valid {
		product.Category = &models.Category{
			ID:    *product.CategoryID,
			Name:  categoryName.String,
			Color: &categoryColor.String,
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Product retrieved successfully",
		Data:    product,
	})
}

// GetCategories retrieves all categories
func (h *ProductHandler) GetCategories(c *gin.Context) {
	activeOnly := c.Query("active_only") == "true"
	
	query := `
		SELECT id, name, description, color, sort_order, is_active, created_at, updated_at
		FROM categories
	`
	
	if activeOnly {
		query += ` WHERE is_active = true`
	}
	
	query += ` ORDER BY sort_order ASC, name ASC`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch categories",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category

		err := rows.Scan(
			&category.ID, &category.Name, &category.Description, &category.Color,
			&category.SortOrder, &category.IsActive, &category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan category",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Categories retrieved successfully",
		Data:    categories,
	})
}

// GetProductsByCategory retrieves all products in a specific category
func (h *ProductHandler) GetProductsByCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid category ID",
			Error:   stringPtr("invalid_uuid"),
		})
		return
	}

	availableOnly := c.Query("available_only") == "true"

	query := `
		SELECT p.id, p.category_id, p.name, p.description, p.price, p.image_url, 
		       p.barcode, p.sku, p.is_available, p.preparation_time, p.sort_order,
		       p.created_at, p.updated_at,
		       c.name as category_name, c.color as category_color
		FROM products p
		JOIN categories c ON p.category_id = c.id
		WHERE p.category_id = $1
	`

	if availableOnly {
		query += ` AND p.is_available = true`
	}

	query += ` ORDER BY p.sort_order ASC, p.name ASC`

	rows, err := h.db.Query(query, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch products",
			Error:   stringPtr(err.Error()),
		})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		var categoryName, categoryColor sql.NullString

		err := rows.Scan(
			&product.ID, &product.CategoryID, &product.Name, &product.Description,
			&product.Price, &product.ImageURL, &product.Barcode, &product.SKU,
			&product.IsAvailable, &product.PreparationTime, &product.SortOrder,
			&product.CreatedAt, &product.UpdatedAt,
			&categoryName, &categoryColor,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Message: "Failed to scan product",
				Error:   stringPtr(err.Error()),
			})
			return
		}

		// Add category info
		if categoryName.Valid {
			product.Category = &models.Category{
				ID:    *product.CategoryID,
				Name:  categoryName.String,
				Color: &categoryColor.String,
			}
		}

		products = append(products, product)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Products retrieved successfully",
		Data:    products,
	})
}

