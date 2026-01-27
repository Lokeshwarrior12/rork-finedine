// server/internal/middleware/auth.go
package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the structure of the Supabase JWT payload
type Claims struct {
	Sub   string `json:"sub"`   // user ID
	Email string `json:"email"`
	Role  string `json:"role,omitempty"` // custom claim we added in metadata
	jwt.RegisteredClaims
}

// AuthMiddleware validates Supabase JWT and attaches user info to context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		// Expect "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		tokenStr := parts[1]

		// Get JWT secret from env (Supabase JWT secret – from dashboard > Settings > API > JWT Settings)
		secret := os.Getenv("SUPABASE_JWT_SECRET")
		if secret == "" {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error"})
			return
		}

		// Parse and validate JWT
		token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		// Attach to Gin context for use in handlers
		c.Set("userID", claims.Sub)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role) // 'user' or 'restaurant_owner'

		c.Next()
	}
}

// Optional: Get user info from context in handlers
func GetUserID(c *gin.Context) string {
	if val, exists := c.Get("userID"); exists {
		return val.(string)
	}
	return ""
}

func GetUserRole(c *gin.Context) string {
	if val, exists := c.Get("userRole"); exists {
		return val.(string)
	}
	return ""
}
