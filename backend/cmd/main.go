package main

import (
	"log"
	"net/http"
	"os"

	"finedine/backend/handlers"
	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"
	"finedine/backend/internal/middleware"
	"finedine/backend/internal/realtime"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	// ────────────────────────────────────────────────────────────────────────────
	// Environment
	// ────────────────────────────────────────────────────────────────────────────
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("⚠️  No local .env found — using system environment")
	}

	log.Println("🚀 Initializing PrimeDine Backend...")

	// ────────────────────────────────────────────────────────────────────────────
	// Infrastructure
	// ────────────────────────────────────────────────────────────────────────────

	// Redis
	cache.InitRedis()

	// Supabase
	database.InitSupabase()

	// WebSocket Hub
	go realtime.WSHub.Run()
	log.Println("✅ WebSocket hub started")

	// ────────────────────────────────────────────────────────────────────────────
	// Gin
	// ────────────────────────────────────────────────────────────────────────────
	if os.Getenv("NODE_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestLogger())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// ────────────────────────────────────────────────────────────────────────────
	// ROOT ROUTE - Shows API is alive (FIX FOR 404 ERROR)
	// ────────────────────────────────────────────────────────────────────────────
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "PrimeDine API is running",
			"version": "1.0.0",
			"service": "primedine-backend",
			"endpoints": gin.H{
				"health":      "/health",
				"websocket":   "/ws",
				"api":         "/api/v1",
				"auth":        "/api/v1/auth",
				"restaurants": "/api/v1/restaurants",
				"orders":      "/api/v1/orders",
				"bookings":    "/api/v1/bookings",
				"owner":       "/api/v1/owner",
				"admin":       "/api/v1/admin",
			},
		})
	})

	// ────────────────────────────────────────────────────────────────────────────
	// Webhooks  (no auth — Stripe verifies its own signature)
	// ────────────────────────────────────────────────────────────────────────────
	router.POST("/webhooks/stripe", handlers.StripeWebhook)

	// ────────────────────────────────────────────────────────────────────────────
	// Health & Realtime
	// ────────────────────────────────────────────────────────────────────────────
	router.GET("/health", handlers.HealthCheck)
	router.GET("/ws", realtime.HandleWebSocket)

	// ────────────────────────────────────────────────────────────────────────────
	// API v1
	// ────────────────────────────────────────────────────────────────────────────
	v1 := router.Group("/api/v1")

	// ── Auth (public, rate-limited) ─────────────────────────────────────────────
	auth := v1.Group("/auth")
	auth.Use(middleware.RateLimiter(20))
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/verify", handlers.VerifyEmail)
		auth.POST("/forgot-password", handlers.ForgotPassword)
		auth.POST("/reset-password", handlers.ResetPassword)
		auth.POST("/refresh", handlers.RefreshToken)
	}

	// ── Public (read-only browse) ───────────────────────────────────────────────
	public := v1.Group("")
	public.Use(middleware.RateLimiter(100))
	{
		public.GET("/restaurants", handlers.GetRestaurants)
		public.GET("/restaurants/nearby", handlers.GetNearbyRestaurants)
		public.GET("/restaurants/:id", handlers.GetRestaurantByID)
		public.GET("/restaurants/:id/menu", handlers.GetRestaurantMenu)

		public.GET("/deals", handlers.GetActiveDeals)
		public.GET("/deals/featured", handlers.GetFeaturedDeals)

		public.GET("/search", handlers.SearchRestaurants)
	}

	// ── Protected (authenticated users) ─────────────────────────────────────────
	protected := v1.Group("")
	protected.Use(middleware.AuthMiddleware(os.Getenv("SUPABASE_JWT_SECRET")))
	protected.Use(middleware.RateLimiter(200))
	{
		// Profile
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

	// ── Owner (restaurant owners only) ──────────────────────────────────────────
	owner := v1.Group("/owner")
	owner.Use(middleware.AuthMiddleware(os.Getenv("SUPABASE_JWT_SECRET")))
	owner.Use(middleware.RestaurantOwnerOnly())
	owner.Use(middleware.APIKeyRateLimiter(500))
	{
		// Restaurant management
		owner.POST("/restaurants", handlers.CreateRestaurant)
		owner.PUT("/restaurants/:id", handlers.UpdateRestaurant)

		// Orders
		owner.GET("/restaurants/:id/orders", handlers.GetRestaurantOrders)
		owner.PATCH("/restaurants/:id/orders/:orderId/status", handlers.UpdateOrderStatus)

		// Menu
		owner.POST("/restaurants/:id/menu", handlers.AddMenuItem)
		owner.PUT("/menu-items/:id", handlers.UpdateMenuItem)
		owner.DELETE("/menu-items/:id", handlers.DeleteMenuItem)

		// Deals
		owner.POST("/restaurants/:id/deals", handlers.CreateDeal)
		owner.PUT("/deals/:id", handlers.UpdateDeal)
		owner.DELETE("/deals/:id", handlers.DeleteDeal)

		// Inventory
		owner.GET("/restaurants/:id/inventory", handlers.GetInventory)
		owner.POST("/restaurants/:id/inventory", handlers.AddInventoryItem)
		owner.PUT("/inventory/:id", handlers.UpdateInventoryItem)
		owner.DELETE("/inventory/:id", handlers.DeleteInventoryItem)

		// Employees
		owner.GET("/restaurants/:id/employees", handlers.GetRestaurantEmployees)
		owner.POST("/restaurants/:id/employees", handlers.CreateEmployee)
		owner.PUT("/employees/:id", handlers.UpdateEmployee)
		owner.DELETE("/employees/:id", handlers.DeleteEmployee)

		// Shifts
		owner.GET("/restaurants/:id/shifts", handlers.GetRestaurantShifts)
		owner.POST("/restaurants/:id/shifts", handlers.CreateShift)
		owner.DELETE("/shifts/:id", handlers.DeleteShift)

		// Offers
		owner.GET("/restaurants/:id/offers", handlers.GetRestaurantOffers)
		owner.POST("/restaurants/:id/offers", handlers.CreateOffer)
		owner.PUT("/offers/:id", handlers.UpdateOffer)
		owner.DELETE("/offers/:id", handlers.DeleteOffer)

		// Coupons & Transactions
		owner.POST("/coupons/validate", handlers.ValidateCoupon)
		owner.POST("/restaurants/:id/transactions", handlers.CreateTransaction)
		owner.GET("/restaurants/:id/transactions", handlers.GetRestaurantTransactions)

		// Bookings
		owner.GET("/restaurants/:id/bookings", handlers.GetRestaurantBookings)
		owner.PATCH("/bookings/:id/status", handlers.UpdateBookingStatus)

		// Analytics
		owner.GET("/restaurants/:id/analytics", handlers.GetRestaurantAnalytics)

		// Subscription
		owner.POST("/subscription/checkout", handlers.CreateSubscriptionCheckout)
		owner.GET("/subscription/status", handlers.GetSubscriptionStatus)
	}

	// ── Admin ───────────────────────────────────────────────────────────────────
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthMiddleware(os.Getenv("SUPABASE_JWT_SECRET")))
	admin.Use(middleware.AdminOnly())
	{
		admin.GET("/users", handlers.GetAllUsers)
		admin.GET("/restaurants/pending", handlers.GetPendingRestaurants)
		admin.PATCH("/restaurants/:id/verify", handlers.VerifyRestaurant)
	}

	// ────────────────────────────────────────────────────────────────────────────
	// Start server
	// ────────────────────────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := "0.0.0.0:" + port

	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("🚀  PrimeDine Backend Server")
	log.Printf("🌐  Listening on %s", addr)
	log.Printf("🌐  Environment: %s", os.Getenv("NODE_ENV"))
	log.Printf("🔧  Supabase URL: %s", os.Getenv("EXPO_PUBLIC_SUPABASE_URL"))
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	if err := router.Run(addr); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}


