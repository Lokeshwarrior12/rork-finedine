// backend/cmd/api/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"rork-finedine/backend/internal/config"
	"rork-finedine/backend/internal/database"
	"rork-finedine/backend/internal/cache"
	"rork-finedine/backend/internal/handlers"
	"rork-finedine/backend/internal/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()
	
	// Initialize database connection
	db, err := database.NewClient(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	
	// Initialize Redis cache
	redisClient, err := cache.NewRedisClient(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize Gin router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Update with your app scheme in production
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Rate limiting middleware
	router.Use(middleware.RateLimiter(redisClient))

	// Initialize handlers
	h := handlers.New(db, redisClient, cfg)

	// Health check endpoint (no auth required)
	router.GET("/health", h.HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes (no authentication)
		public := v1.Group("")
		{
			public.GET("/restaurants", h.GetRestaurants)
			public.GET("/restaurants/:id", h.GetRestaurant)
			public.GET("/restaurants/:id/menu", h.GetRestaurantMenu)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.SupabaseJWTSecret))
		{
			// User routes
			protected.GET("/profile", h.GetUserProfile)
			protected.PUT("/profile", h.UpdateUserProfile)

			// Order routes
			protected.POST("/orders", h.CreateOrder)
			protected.GET("/orders/:id", h.GetOrder)
			protected.GET("/orders/user/:userId", h.GetUserOrders)
			
			// Booking routes
			protected.POST("/bookings", h.CreateBooking)
			protected.GET("/bookings/:id", h.GetBooking)
			protected.GET("/bookings/user/:userId", h.GetUserBookings)

			// Favorites
			protected.POST("/favorites", h.AddFavorite)
			protected.GET("/favorites", h.GetFavorites)
			protected.DELETE("/favorites/:restaurantId", h.RemoveFavorite)

			// Notifications
			protected.GET("/notifications", h.GetNotifications)
			protected.PATCH("/notifications/:id/read", h.MarkNotificationRead)
		}

		// Restaurant owner routes (require owner role)
		owner := v1.Group("")
		owner.Use(middleware.AuthMiddleware(cfg.SupabaseJWTSecret))
		owner.Use(middleware.RequireRole("restaurant_owner"))
		{
			owner.POST("/restaurants", h.CreateRestaurant)
			owner.PUT("/restaurants/:id", h.UpdateRestaurant)
			owner.DELETE("/restaurants/:id", h.DeleteRestaurant)
			
			owner.POST("/restaurants/:id/menu", h.AddMenuItem)
			owner.PUT("/menu-items/:id", h.UpdateMenuItem)
			owner.DELETE("/menu-items/:id", h.DeleteMenuItem)
			
			owner.GET("/restaurants/:id/orders", h.GetRestaurantOrders)
			owner.PATCH("/orders/:id/status", h.UpdateOrderStatus)
			
			owner.GET("/restaurants/:id/inventory", h.GetInventory)
			owner.PUT("/inventory/:id", h.UpdateInventory)
			
			owner.GET("/restaurants/:id/analytics", h.GetRestaurantAnalytics)
		}

		// Admin routes (require admin role)
		admin := v1.Group("")
		admin.Use(middleware.AuthMiddleware(cfg.SupabaseJWTSecret))
		admin.Use(middleware.RequireRole("admin"))
		{
			admin.GET("/users", h.GetAllUsers)
			admin.PATCH("/users/:id/role", h.UpdateUserRole)
			admin.GET("/restaurants/pending", h.GetPendingRestaurants)
			admin.PATCH("/restaurants/:id/approve", h.ApproveRestaurant)
		}

		// Payment webhook (Stripe)
		v1.POST("/webhooks/stripe", h.HandleStripeWebhook)
	}

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:           ":" + port,
		Handler:        router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Graceful shutdown
	go func() {
		log.Printf("🚀 Server starting on port %s", port)
		log.Printf("📊 Environment: %s", cfg.Environment)
		log.Printf("✅ Database connected: %s", cfg.DatabaseURL[:30]+"...")
		log.Printf("✅ Redis connected: %s", cfg.RedisURL[:30]+"...")
		
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited")
}
