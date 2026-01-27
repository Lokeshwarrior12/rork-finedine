package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "yourproject/server/internal/api"
    "yourproject/server/internal/middleware"
)

func main() {
    godotenv.Load()
    r := gin.Default()

    // Global Middleware
    r.Use(middleware.AuthMiddleware())     // JWT from Supabase
    r.Use(middleware.RateLimitMiddleware()) // Per user/IP
    r.Use(middleware.CacheMiddleware())    // Redis for hot reads

    // API Routes
    api.SetupRoutes(r)

    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }
    log.Printf("Server starting on :%s", port)
    r.Run(":" + port)
}
