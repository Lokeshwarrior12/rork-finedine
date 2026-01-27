// server/cmd/main.go
package main
import (
	// ... existing imports
	"rork-finedine/server/internal/cache"
)
import (
	// ...
	"rork-finedine/server/internal/api"
)
import (
	// ...
	"rork-finedine/server/internal/middleware"
)
import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"rork-finedine/server/internal/api"
	"rork-finedine/server/internal/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found - using system env vars")
	}

	r := gin.Default()
	r.Use(middleware.RateLimitMiddleware())

	// Then auth (protected routes)
	r.Use(middleware.AuthMiddleware())
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Auth middleware (applied globally, but we can skip for public routes later)
	r.Use(middleware.AuthMiddleware())

	// Public health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"version": "0.1.0",
			"env":     os.Getenv("ENV") == "" ? "development" : os.Getenv("ENV"),
		})
	})
    cache.Init()
	// Protected example
	r.GET("/protected", func(c *gin.Context) {
		userID := middleware.GetUserID(c)
		role := middleware.GetUserRole(c)
		c.JSON(http.StatusOK, gin.H{
			"message": "Authenticated!",
			"userID":  userID,
			"role":    role,
		})
	})
// Register API groups
	apiGroup := r.Group("/api")
	api.SetupRestaurantsRoutes(apiGroup)
	api.SetupProfileRoutes(apiGroup) // NEW
	// NEW: Register restaurant routes (some public, some will be protected later)
	api.SetupRestaurantsRoutes(r.Group("/api"))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("FineDine Go server starting on http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
