package handlers

import (
	"net/http"
	"time"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

// Get restaurant analytics
func GetRestaurantAnalytics(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	period := c.DefaultQuery("period", "week") // week, month, year

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Calculate date range
	var startDate time.Time
	now := time.Now()

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, 0, -7)
	}

	// Get orders data
	orders, _, _ := database.Query("orders").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Gte("created_at", startDate.Format(time.RFC3339)).
		Execute()

	// Get bookings data
	bookings, _, _ := database.Query("bookings").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Gte("created_at", startDate.Format(time.RFC3339)).
		Execute()

	// Calculate analytics
	var totalRevenue float64
	var completedOrders int
	var cancelledOrders int

	// This would need proper JSON parsing in production
	// Simplified for demonstration

	analytics := gin.H{
		"period":            period,
		"total_orders":      len(orders.([]interface{})),
		"completed_orders":  completedOrders,
		"cancelled_orders":  cancelledOrders,
		"total_revenue":     totalRevenue,
		"total_bookings":    len(bookings.([]interface{})),
		"average_order":     0, // Calculate from orders
		"popular_items":     []interface{}{}, // Extract from orders
		"peak_hours":        []interface{}{}, // Calculate from orders
		"customer_reviews":  0,
		"average_rating":    0,
	}

	c.JSON(http.StatusOK, gin.H{"data": analytics})
}
