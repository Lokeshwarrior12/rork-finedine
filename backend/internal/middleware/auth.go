package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

/*
-----------------------------------------------------
JWT CLAIMS
-----------------------------------------------------
Compatible with Supabase JWT structure
*/
type Claims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

/*
-----------------------------------------------------
AUTH MIDDLEWARE
-----------------------------------------------------
- Validates Bearer token
- Verifies signature using JWT secret
- Injects user context
*/
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// Expect: Authorization: Bearer <token>
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(
			tokenString,
			&Claims{},
			func(token *jwt.Token) (interface{}, error) {
				// Enforce HMAC signing
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			},
		)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Inject user context
		c.Set("userId", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

/*
-----------------------------------------------------
ROLE GUARDS
-----------------------------------------------------
*/

func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok || roleStr != requiredRole {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Requires %s role", requiredRole),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return RequireRole("admin")
}

func RestaurantOwnerOnly() gin.HandlerFunc {
	return RequireRole("restaurant_owner")
}

/*
-----------------------------------------------------
CONTEXT HELPERS
-----------------------------------------------------
*/

func GetUserID(c *gin.Context) (string, error) {
	userID, exists := c.Get("userId")
	if !exists {
		return "", fmt.Errorf("user ID not found in context")
	}

	id, ok := userID.(string)
	if !ok {
		return "", fmt.Errorf("invalid user ID type")
	}

	return id, nil
}

func GetUserRole(c *gin.Context) (string, error) {
	role, exists := c.Get("userRole")
	if !exists {
		return "", fmt.Errorf("user role not found in context")
	}

	roleStr, ok := role.(string)
	if !ok {
		return "", fmt.Errorf("invalid role type")
	}

	return roleStr, nil
}
