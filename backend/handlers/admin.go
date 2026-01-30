package handlers

import (
	"net/http"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

// Get all users (admin only)
func GetAllUsers(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	// Convert to integers and calculate offset
	// Simplified - add proper pagination

	result, _, err := database.Query("users").
		Select("id, email, full_name, role, created_at").
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Limit(50).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Get pending restaurants (awaiting verification)
func GetPendingRestaurants(c *gin.Context) {
	result, _, err := database.Query("restaurants").
		Select("*, owner:users(id, full_name, email)").
		Eq("is_verified", "false").
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending restaurants"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Verify restaurant
func VerifyRestaurant(c *gin.Context) {
	restaurantID := c.Param("id")

	var input struct {
		Verified bool   `json:"verified" binding:"required"`
		Notes    string `json:"notes"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, _, err := database.Query("restaurants").
		Update(map[string]interface{}{
			"is_verified": input.Verified,
		}, "", "*, owner:users(id, full_name, email)").
		Eq("id", restaurantID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify restaurant"})
		return
	}

	// Send notification to restaurant owner
	// Parse result and send email/push notification

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Restaurant verification status updated",
	})
}
