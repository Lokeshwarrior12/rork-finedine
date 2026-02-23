package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetRestaurantAnalytics - owner analytics dashboard
func GetRestaurantAnalytics(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	period := c.DefaultQuery("period", "week") // week | month | year

	// Verify ownership
	_, _, err := database.Query("restaurants").
Select("id", "", false).
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Calculate date range
	now := time.Now()
	var startDate time.Time
	switch period {
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default: // week
		startDate = now.AddDate(0, 0, -7)
	}
	startISO := startDate.Format(time.RFC3339)

	// Fetch orders
	rawOrders, _, _ := database.Query("orders").
Select("id, total_amount, status, created_at", "", false).
		Eq("restaurant_id", restaurantID).
		Gte("created_at", startISO).
		Execute()

	// Fetch bookings
	rawBookings, _, _ := database.Query("bookings").
Select("id, status, booking_date, party_size", "", false).
		Eq("restaurant_id", restaurantID).
		Gte("created_at", startISO).
		Execute()

	// Parse orders
	var orders []map[string]interface{}
	if rawOrders != nil {
		json.Unmarshal(rawOrders, &orders)
	}

	// Parse bookings
	var bookings []map[string]interface{}
	if rawBookings != nil {
		json.Unmarshal(rawBookings, &bookings)
	}

	// Aggregate order metrics
	var totalRevenue float64
	var completedOrders, cancelledOrders int

	for _, o := range orders {
		if status, ok := o["status"].(string); ok {
			switch status {
			case "completed", "delivered":
				completedOrders++
				if amount, ok := o["total_amount"].(float64); ok {
					totalRevenue += amount
				}
			case "cancelled":
				cancelledOrders++
			}
		}
	}

	var avgOrder float64
	if completedOrders > 0 {
		avgOrder = totalRevenue / float64(completedOrders)
	}

	// Aggregate bookings
	var confirmedBookings, cancelledBookings int
	for _, b := range bookings {
		if status, ok := b["status"].(string); ok {
			switch status {
			case "confirmed":
				confirmedBookings++
			case "cancelled":
				cancelledBookings++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"period":              period,
			"start_date":          startISO,
			"end_date":            now.Format(time.RFC3339),
			"total_orders":        len(orders),
			"completed_orders":    completedOrders,
			"cancelled_orders":    cancelledOrders,
			"total_revenue":       totalRevenue,
			"average_order_value": avgOrder,
			"total_bookings":      len(bookings),
			"confirmed_bookings":  confirmedBookings,
			"cancelled_bookings":  cancelledBookings,
			"popular_items":       []interface{}{},
			"peak_hours":          []interface{}{},
		},
	})
}


