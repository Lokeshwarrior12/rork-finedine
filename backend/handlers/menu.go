package handlers

import (
	"net/http"

	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func AddMenuItem(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input map[string]interface{}
	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

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

	input["restaurant_id"] = restaurantID

	result, _, err := database.Query("menu_items").
		Insert(input, false, "", "", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add menu item"})
		return
	}

	// Invalidate menu cache
	cache.Delete(cache.MenuKey(restaurantID))

	c.JSON(http.StatusCreated, gin.H{"data": result})
}

func UpdateMenuItem(c *gin.Context) {
	menuItemID := c.Param("id")

	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	result, _, err := database.Query("menu_items").
		Update(updates, "", "restaurant_id").
		Eq("id", menuItemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func DeleteMenuItem(c *gin.Context) {
	menuItemID := c.Param("id")

	_, _, err := database.Query("menu_items").
		Delete("", "").
		Eq("id", menuItemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu item deleted"})
}
