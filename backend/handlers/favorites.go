package handlers

import (
	"net/http"

	"finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func AddFavorite(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID string `json:"restaurant_id" binding:"required"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, _, err := database.Query("favorites").
		Insert(map[string]interface{}{
			"user_id":       userID,
			"restaurant_id": input.RestaurantID,
		}, false, "", "", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add favorite"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": result})
}

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

	c.JSON(http.StatusOK, gin.H{"message": "Favorite removed"})
}

func GetFavorites(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("favorites").
		Select("*, restaurant:restaurants(*)").
		Eq("user_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch favorites"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
