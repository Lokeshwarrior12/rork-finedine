package handlers

import (
	"net/http"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func GetInventory(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	// Verify ownership
	_, _, err := database.Query("restaurants

// Owner: Create restaurant
func CreateRestaurant(c *gin.Context) {
	userID := c.GetString("userId")

	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	input["owner_id"] = userID

	result, _, err := database.Query("restaurants").
		Insert(input, false, "", "", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create restaurant"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": result})
}

// Owner: Update restaurant
func UpdateRestaurant(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, _, err := database.Query("restaurants").
		Update(updates, "", "").
		Eq("id", id).
		Eq("owner_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update restaurant"})
		return
	}

	// Invalidate cache
	cache.Delete(cache.RestaurantKey(id))
	cache.Delete(cache.RestaurantsListKey("all"))

	c.JSON(http.StatusOK, gin.H{"data": result})
}
