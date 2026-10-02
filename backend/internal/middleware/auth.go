package middleware

import (
	"net/http"
	"strings"
	"time"

	"pos-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWT Secret - In production, this should be loaded from environment variables
var jwtSecret = []byte("your-secret-key-change-this-in-production")

// Claims represents the JWT claims
type Claims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Role     string    `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken generates a JWT token for a user
func GenerateToken(user *models.User) (string, error) {
	// Set token expiration time (24 hours)
	expirationTime := time.Now().Add(24 * time.Hour)

	// Create claims
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pos-system",
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	// Check if token is valid
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrInvalidKey
}

// AuthMiddleware returns a gin middleware function for JWT authentication
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Authorization header is required",
				Error:   stringPtr("missing_auth_header"),
			})
			c.Abort()
			return
		}

		// Check if header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Invalid authorization header format",
				Error:   stringPtr("invalid_auth_format"),
			})
			c.Abort()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Validate token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Message: "Invalid or expired token",
				Error:   stringPtr("invalid_token"),
			})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RequireRole returns a middleware that checks if the user has the required role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Role information not found",
				Error:   stringPtr("missing_role"),
			})
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok || userRole != requiredRole {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Insufficient permissions",
				Error:   stringPtr("insufficient_permissions"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRoles returns a middleware that checks if the user has any of the required roles
func RequireRoles(requiredRoles []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Role information not found",
				Error:   stringPtr("missing_role"),
			})
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Invalid role information",
				Error:   stringPtr("invalid_role"),
			})
			c.Abort()
			return
		}

		// Check if user role is in the required roles
		hasPermission := false
		for _, requiredRole := range requiredRoles {
			if userRole == requiredRole {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Message: "Insufficient permissions",
				Error:   stringPtr("insufficient_permissions"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserFromContext extracts user information from gin context
func GetUserFromContext(c *gin.Context) (uuid.UUID, string, string, bool) {
	userID, userIDExists := c.Get("user_id")
	username, usernameExists := c.Get("username")
	role, roleExists := c.Get("role")

	if !userIDExists || !usernameExists || !roleExists {
		return uuid.Nil, "", "", false
	}

	id, idOk := userID.(uuid.UUID)
	name, nameOk := username.(string)
	userRole, roleOk := role.(string)

	if !idOk || !nameOk || !roleOk {
		return uuid.Nil, "", "", false
	}

	return id, name, userRole, true
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}

