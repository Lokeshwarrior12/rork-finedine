package handlers

import (
	"net/http"
	"time"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/cache"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/realtime"
	"github.com/gin-gonic/gin"
)

// Get inventory for restaurant
func GetInventory(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

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

	// Get inventory items
	result, _, err := database.Query("inventory").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Order("item_name", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Add inventory item
func AddInventoryItem(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input struct {
		ItemName      string  `json:"item_name" binding:"required"`
		Quantity      float64 `json:"quantity" binding:"required"`
		Unit          string  `json:"unit" binding:"required"`
		MinStockLevel float64 `json:"min_stock_level"`
		ExpiryDate    string  `json:"expiry_date"`
	}

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

	// Check if stock is low
	isLowStock := input.Quantity <= input.MinStockLevel

	inventoryData := map[string]interface{}{
		"restaurant_id":   restaurantID,
		"item_name":       input.ItemName,
		"quantity":        input.Quantity,
		"unit":            input.Unit,
		"min_stock_level": input.MinStockLevel,
		"expiry_date":     input.ExpiryDate,
		"is_low_stock":    isLowStock,
	}

	result, _, err := database.Query("inventory").
		Insert(inventoryData, false, "", "", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add inventory item"})
		return
	}

	// Send low stock notification if needed
	if isLowStock {
		sendLowStockNotification(userID, input.ItemName, input.Quantity)
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Inventory item added successfully",
	})
}

// Update inventory item
func UpdateInventoryItem(c *gin.Context) {
	itemID := c.Param("id")
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Get the item to verify ownership
	item, _, err := database.Query("inventory").
		Select("*, restaurant:restaurants(owner_id)").
		Eq("id", itemID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	// Update the item
	result, _, err := database.Query("inventory").
		Update(updates, "", "").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Inventory item updated successfully",
	})
}

// Delete inventory item
func DeleteInventoryItem(c *gin.Context) {
	itemID := c.Param("id")

	_, _, err := database.Query("inventory").
		Delete("", "").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete inventory item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item deleted successfully"})
}

// Helper function to send low stock notification
func sendLowStockNotification(userID, itemName string, quantity float64) {
	notification := map[string]interface{}{
		"user_id": userID,
		"title":   "Low Stock Alert",
		"body":    fmt.Sprintf("%s is running low (%.2f units remaining)", itemName, quantity),
		"type":    "low_stock",
		"data": map[string]interface{}{
			"item_name": itemName,
			"quantity":  quantity,
		},
	}

	database.Query("notifications").Insert(notification, false, "", "", "").Execute()

	// Send real-time notification
	realtime.WSHub.SendToUser(userID, map[string]interface{}{
		"type":    "low_stock_alert",
		"payload": notification,
	})
}
