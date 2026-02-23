package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/supabase-community/postgrest-go"
	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"

	"github.com/gin-gonic/gin"
)

// CreateBooking - authenticated user creates a table booking
func CreateBooking(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID    string `json:"restaurant_id" binding:"required"`
		BookingDate     string `json:"booking_date" binding:"required"`
		BookingTime     string `json:"booking_time" binding:"required"`
		PartySize       int    `json:"party_size" binding:"required,min=1"`
		CustomerName    string `json:"customer_name" binding:"required"`
		CustomerPhone   string `json:"customer_phone" binding:"required"`
		CustomerEmail   string `json:"customer_email"`
		SpecialRequests string `json:"special_requests"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	bookingData := map[string]interface{}{
		"customer_id":      userID,
		"restaurant_id":    input.RestaurantID,
		"booking_date":     input.BookingDate,
		"booking_time":     input.BookingTime,
		"party_size":       input.PartySize,
		"customer_name":    input.CustomerName,
		"customer_phone":   input.CustomerPhone,
		"customer_email":   input.CustomerEmail,
		"special_requests": input.SpecialRequests,
		"status":           "pending",
	}

	result, _, err := database.Query("bookings").
		Insert(bookingData, false, "", "*, restaurant:restaurants(name)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	// Parse result and send real-time events
	var bookings []map[string]interface{}
	if err := json.Unmarshal(result, &bookings); err == nil && len(bookings) > 0 {
		booking := bookings[0]

		// Notify restaurant owner
		realtime.WSHub.SendToUser(input.RestaurantID, map[string]interface{}{
			"type":    "new_booking",
			"payload": booking,
		})

		// Send confirmation to customer
		if bookingID, ok := booking["id"].(string); ok {
			realtime.SendBookingConfirmation(bookingID, userID)
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Booking created successfully",
	})
}

// GetUserBookings - list all bookings for the authenticated user
func GetUserBookings(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
Select("*, restaurant:restaurants(id, name, logo_url, address)", "", false).
		Eq("customer_id", userID).
		Order("booking_date", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// GetBookingByID - get a single booking (owned by the requesting user)
func GetBookingByID(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
Select("*, restaurant:restaurants(*)", "", false).
		Eq("id", bookingID).
		Eq("customer_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CancelBooking - customer cancels their own booking
func CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
		Update(map[string]interface{}{"status": "cancelled"}, "", "").
		Eq("id", bookingID).
		Eq("customer_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Booking cancelled successfully",
	})
}

// GetRestaurantBookings - owner views bookings for their restaurant
func GetRestaurantBookings(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	date := c.Query("date")
	status := c.Query("status")

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

	query := database.Query("bookings").
Select("*, customer:users(id, full_name, phone)", "", false).
		Eq("restaurant_id", restaurantID)

	if date != "" {
		query = query.Eq("booking_date", date)
	}
	if status != "" {
		query = query.Eq("status", status)
	}

	result, _, err := query.
		Order("booking_date", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// UpdateBookingStatus - owner updates a booking status
func UpdateBookingStatus(c *gin.Context) {
	bookingID := c.Param("id")

	var input struct {
		Status string `json:"status" binding:"required,oneof=pending confirmed cancelled completed no_show"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status value"})
		return
	}

	result, _, err := database.Query("bookings").
		Update(map[string]interface{}{"status": input.Status}, "", "*, customer:users(id)").
		Eq("id", bookingID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking"})
		return
	}

	// Push real-time update to customer
	var bookings []map[string]interface{}
	if err := json.Unmarshal(result, &bookings); err == nil && len(bookings) > 0 {
		booking := bookings[0]
		if customer, ok := booking["customer"].(map[string]interface{}); ok {
			if customerID, ok := customer["id"].(string); ok {
				realtime.WSHub.SendToUser(customerID, map[string]interface{}{
					"type": "booking_update",
					"payload": map[string]interface{}{
						"booking_id": bookingID,
						"status":     input.Status,
					},
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Booking status updated",
	})
}


