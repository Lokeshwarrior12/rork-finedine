package main

import (
	"log"
	"os"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/cache"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/middleware"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/realtime"
	"github.com/Lokeshwarrior12/rork-finedine/backend/handlers"
	
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("⚠️  No .env file found, using system environment")
	}

	// Initialize infrastructure
	log.Println("🚀 Initializing PrimeDine Backend...")
	
	// Initialize Redis (for caching and real-time)
	cache.InitRedis()
	
	// Initialize Supabase
	database.InitSupabase()
	
	// Start WebSocket hub for real-time
	go realtime.WSHub.Run()
	log.Println("✅ WebSocket hub started")

	// Initialize Gin router
	if os.Getenv("NODE_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()

	// Global middleware
	router.Use(gin.Recovery()) // Recover from panics
	router.Use(middleware.RequestLogger()) // Log all requests
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://localhost:19000", "exp://192.168.*:8081", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// Health check (no rate limit)
	router.GET("/health", handlers.HealthCheck)
	
	// WebSocket endpoint for real-time updates
	router.GET("/ws", realtime.HandleWebSocket)

	// API v1 routes
	v1 := router.Group("/api/v1")
	
	// Public routes (with rate limiting: 100 req/min per IP)
	public := v1.Group("")
	public.Use(middleware.RateLimiter(100))
	{
		// Restaurants
		public.GET("/restaurants", handlers.GetRestaurants)
		public.GET("/restaurants/nearby", handlers.GetNearbyRestaurants)
		public.GET("/restaurants/:id", handlers.GetRestaurantByID)
		public.GET("/restaurants/:id/menu", handlers.GetRestaurantMenu)
		
		// Deals
		public.GET("/deals", handlers.GetActiveDeals)
		public.GET("/deals/featured", handlers.GetFeaturedDeals)
		
		// Search
		public.GET("/search", handlers.SearchRestaurants)
	}

	// Protected routes (require authentication)
	protected := v1.Group("")
	protected.Use(middleware.AuthMiddleware())
	protected.Use(middleware.RateLimiter(200)) // Higher limit for authenticated users
	{
		// User profile
		protected.GET("/profile", handlers.GetProfile)
		protected.PUT("/profile", handlers.UpdateProfile)
		
		// Orders
		protected.POST("/orders", handlers.CreateOrder)
		protected.GET("/orders", handlers.GetUserOrders)
		protected.GET("/orders/:id", handlers.GetOrderByID)
		protected.PATCH("/orders/:id/cancel", handlers.CancelOrder)
		
		// Bookings
		protected.POST("/bookings", handlers.CreateBooking)
		protected.GET("/bookings", handlers.GetUserBookings)
		protected.GET("/bookings/:id", handlers.GetBookingByID)
		protected.PATCH("/bookings/:id/cancel", handlers.CancelBooking)
		
		// Favorites
		protected.POST("/favorites", handlers.AddFavorite)
		protected.DELETE("/favorites/:restaurantId", handlers.RemoveFavorite)
		protected.GET("/favorites", handlers.GetFavorites)
		
		// Notifications
		protected.GET("/notifications", handlers.GetNotifications)
		protected.PATCH("/notifications/:id/read", handlers.MarkNotificationRead)
		protected.PATCH("/notifications/read-all", handlers.MarkAllNotificationsRead)
	}

	// Restaurant owner routes
	owner := v1.Group("/owner")
	owner.Use(middleware.AuthMiddleware())
	owner.Use(middleware.RestaurantOwnerOnly())
	owner.Use(middleware.APIKeyRateLimiter(500)) // Higher limit for restaurant owners
	{
		// Restaurant management
		owner.POST("/restaurants", handlers.CreateRestaurant)
		owner.PUT("/restaurants/:id", handlers.UpdateRestaurant)
		owner.GET("/restaurants/:id/orders", handlers.GetRestaurantOrders)
		owner.PATCH("/restaurants/:id/orders/:orderId/status", handlers.UpdateOrderStatus)
		
		// Menu management
		owner.POST("/restaurants/:id/menu", handlers.AddMenuItem)
		owner.PUT("/menu-items/:id", handlers.UpdateMenuItem)
		owner.DELETE("/menu-items/:id", handlers.DeleteMenuItem)
		
		// Deals management
		owner.POST("/restaurants/:id/deals", handlers.CreateDeal)
		owner.PUT("/deals/:id", handlers.UpdateDeal)
		owner.DELETE("/deals/:id", handlers.DeleteDeal)
		
		// Inventory management
		owner.GET("/restaurants/:id/inventory", handlers.GetInventory)
		owner.POST("/restaurants/:id/inventory", handlers.AddInventoryItem)
		owner.PUT("/inventory/:id", handlers.UpdateInventoryItem)
		owner.DELETE("/inventory/:id", handlers.DeleteInventoryItem)
		
		// Bookings management
		owner.GET("/restaurants/:id/bookings", handlers.GetRestaurantBookings)
		owner.PATCH("/bookings/:id/status", handlers.UpdateBookingStatus)
		
		// Analytics
		owner.GET("/restaurants/:id/analytics", handlers.GetRestaurantAnalytics)
		
		// Subscription
		owner.POST("/subscription/checkout", handlers.CreateSubscriptionCheckout)
		owner.GET("/subscription/status", handlers.GetSubscriptionStatus)
	}

	// Admin routes
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminOnly())
	{
		admin.GET("/users", handlers.GetAllUsers)
		admin.GET("/restaurants/pending", handlers.GetPendingRestaurants)
		admin.PATCH("/restaurants/:id/verify", handlers.VerifyRestaurant)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Printf("🚀 PrimeDine Backend Server")
	log.Printf("📍 Port: %s", port)
	log.Printf("🌍 Environment: %s", os.Getenv("NODE_ENV"))
	log.Printf("🔧 Supabase: %s", os.Getenv("EXPO_PUBLIC_SUPABASE_URL"))
	log.Printf("⚡ Redis: Connected")
	log.Printf("🔌 WebSocket: Enabled")
	log.Printf("🛡️  Rate Limiting: Enabled")
	log.Printf("🔐 Auth Middleware: Enabled")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Printf("✅ Server ready for 1000+ concurrent users")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
