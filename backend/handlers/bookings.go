package handlers

import (
	"encoding/json"
	"net/http"

	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"
	"github.com/gin-gonic/gin"
)

// Create booking
func CreateBooking(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID    string `json:"restaurant_id" binding:"required"`
		BookingDate     string `json:"booking_date" binding:"required"`
		BookingTime     string `json:"booking_time" binding:"required"`
		PartySize       int    `json:"party_size" binding:"required"`
		CustomerName    string `json:"customer_name" binding:"required"`
		CustomerPhone   string `json:"customer_phone" binding:"required"`
		CustomerEmail   string `json:"customer_email"`
		SpecialRequests string `json:"special_requests"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
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

	// Parse result
	var bookings []map[string]interface{}
	json.Unmarshal(result, &bookings)
	if len(bookings) > 0 {
		booking := bookings[0]
		bookingID := booking["id"].(string)

		// Send real-time notification to restaurant owner
		realtime.WSHub.SendToUser(input.RestaurantID, map[string]interface{}{
			"type":    "new_booking",
			"payload": booking,
		})

		// Send confirmation to customer
		realtime.SendBookingConfirmation(bookingID, userID)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Booking created successfully",
	})
}

// Get user bookings
func GetUserBookings(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
		Select("*, restaurant:restaurants(id, name, logo_url, address)").
		Eq("customer_id", userID).
		Order("booking_date", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Get booking by ID
func GetBookingByID(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
		Select("*, restaurant:restaurants(*)").
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

// Cancel booking
func CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("bookings").
		Update(map[string]interface{}{
			"status": "cancelled",
		}, "", "").
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

// Owner: Get restaurant bookings
func GetRestaurantBookings(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	date := c.Query("date")

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

	query := database.Query("bookings").
		Select("*, customer:users(id, full_name, phone)").
		Eq("restaurant_id", restaurantID)

	if date != "" {
		query = query.Eq("booking_date", date)
	}

	result, _, err := query.
		Order("booking_time", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Update booking status
func UpdateBookingStatus(c *gin.Context) {
	bookingID := c.Param("id")

	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, _, err := database.Query("bookings").
		Update(map[string]interface{}{
			"status": input.Status,
		}, "", "*, customer:users(id)").
		Eq("id", bookingID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking"})
		return
	}

	// Send real-time update to customer
	var bookings []map[string]interface{}
	json.Unmarshal(result, &bookings)
	if len(bookings) > 0 {
		booking := bookings[0]
		if customer, ok := booking["customer"].(map[string]interface{}); ok {
			customerID := customer["id"].(string)
			realtime.WSHub.SendToUser(customerID, map[string]interface{}{
				"type": "booking_update",
				"payload": map[string]interface{}{
					"booking_id": bookingID,
					"status":     input.Status,
				},
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Booking status updated",
	})
}
