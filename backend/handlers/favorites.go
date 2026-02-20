package handlers

import (
	"net/http"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// AddFavorite - add a restaurant to the user's favorites
func AddFavorite(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID string `json:"restaurant_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "restaurant_id is required"})
		return
	}

	result, _, err := database.Query("favorites").
		Insert(map[string]interface{}{
			"user_id":       userID,
			"restaurant_id": input.RestaurantID,
		}, false, "", "*, restaurant:restaurants(id, name, logo_url)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add favorite"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Restaurant added to favorites",
	})
}

// RemoveFavorite - remove a restaurant from favorites
func RemoveFavorite(c *gin.Context) {
	userID := c.GetString("userId")
	restaurantID := c.Param("restaurantId")

	_, _, err := database.Query("favorites").
		Delete("", "").
		Eq("user_id", userID).
		Eq("restaurant_id", restaurantID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove favorite"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Restaurant removed from favorites"})
}

// GetFavorites - list all favorites for the authenticated user
func GetFavorites(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("favorites").
		Select("*, restaurant:restaurants(id, name, logo_url, cuisine_type, rating, address, city, opening_hours, waiting_time, categories)").
		Eq("user_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch favorites"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
