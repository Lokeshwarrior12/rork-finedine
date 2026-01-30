package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://localhost:19000", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":      "ok",
			"environment": os.Getenv("NODE_ENV"),
			"timestamp":   "now",
		})
	})

	// Public routes
	public := router.Group("/api/v1")
	{
		public.GET("/restaurants", getRestaurants)
		public.GET("/restaurants/:id", getRestaurantById)
		public.GET("/deals", getDeals)
	}

	// Protected routes (require auth)
	protected := router.Group("/api/v1")
	protected.Use(authMiddleware())
	{
		protected.POST("/orders", createOrder)
		protected.GET("/orders", getOrders)
		protected.GET("/orders/:id", getOrderById)
		protected.POST("/bookings", createBooking)
		protected.GET("/bookings", getBookings)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📊 Environment: %s", os.Getenv("NODE_ENV"))
	log.Printf("🔧 Supabase: %s", os.Getenv("EXPO_PUBLIC_SUPABASE_URL"))
	
	router.Run(":" + port)
}

// Auth middleware
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Implement JWT verification
		// For now, just pass through
		c.Next()
	}
}

// Placeholder handlers
func getRestaurants(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get restaurants endpoint"})
}

func getRestaurantById(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get restaurant by ID endpoint"})
}

func getDeals(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get deals endpoint"})
}

func createOrder(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Create order endpoint"})
}

func getOrders(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get orders endpoint"})
}

func getOrderById(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get order by ID endpoint"})
}

func createBooking(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Create booking endpoint"})
}

func getBookings(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Get bookings endpoint"})
}
