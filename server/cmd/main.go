package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"finedine-server/internal/api"
	"finedine-server/internal/cache"
	"finedine-server/internal/middleware"
	"finedine-server/internal/repositories"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found - using system env vars")
	}

	repositories.Init()
	cache.Init()

	r := gin.Default()

	r.Use(middleware.CORSMiddleware())
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"version": "0.1.0",
			"env":     env,
		})
	})

	publicAPI := r.Group("/api")
	api.SetupPublicRoutes(publicAPI)

	protectedAPI := r.Group("/api")
	protectedAPI.Use(middleware.AuthMiddleware())
	api.SetupProtectedRoutes(protectedAPI)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("FineDine Go server starting on http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
