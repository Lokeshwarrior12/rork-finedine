// server/cmd/main.go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"yourproject/server/internal/middleware" // adjust import path if needed
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found - using system env vars")
	}

	// Initialize Gin router
	r := gin.Default()

	// Global middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Apply auth middleware to ALL routes (we'll make some public later)
	r.Use(middleware.AuthMiddleware())

	// Health check endpoint - no auth needed (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"version": "0.1.0",
			"env":     os.Getenv("ENV") == "" ? "development" : os.Getenv("ENV"),
		})
	})

	// Example protected route - will require valid token
	r.GET("/protected", func(c *gin.Context) {
		userID := middleware.GetUserID(c)
		role := middleware.GetUserRole(c)
		c.JSON(http.StatusOK, gin.H{
			"message": "You are authenticated!",
			"userID":  userID,
			"role":    role,
		})
	})

	// Future: Add more routes here (e.g., /restaurants, /orders)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("FineDine Go server starting on http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
