package handlers

import (
	"net/http"
	"strconv"

	"github.com/supabase-community/postgrest-go"
	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetAllUsers - admin only
func GetAllUsers(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	result, _, err := database.Query("users").
Select("id, email, full_name, role, created_at", "", false).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
Limit(limit, "").
Range(offset, offset+limit-1, "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
		},
	})
}

// GetPendingRestaurants - restaurants awaiting verification
func GetPendingRestaurants(c *gin.Context) {
	result, _, err := database.Query("restaurants").
Select("*, owner:users(id, full_name, email)", "", false).
		Eq("is_verified", "false").
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending restaurants"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// VerifyRestaurant - approve or reject a restaurant
func VerifyRestaurant(c *gin.Context) {
	restaurantID := c.Param("id")

	var input struct {
		Verified bool   `json:"verified"`
		Notes    string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
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

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Restaurant verification status updated",
	})
}


