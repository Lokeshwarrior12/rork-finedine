package handlers

import (
	"fmt"
	"net/http"

	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"

	"github.com/gin-gonic/gin"
)

// GetInventory - owner fetches all inventory items for a restaurant
func GetInventory(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	if err := verifyOwner(restaurantID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("inventory").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Order("name", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// AddInventoryItem - owner adds an inventory item
func AddInventoryItem(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	if err := verifyOwner(restaurantID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var input struct {
		Name        string  `json:"name" binding:"required"`
		Category    string  `json:"category"`
		Quantity    float64 `json:"quantity" binding:"required,min=0"`
		Unit        string  `json:"unit" binding:"required"`
		MinStock    float64 `json:"min_stock"`
		CostPerUnit float64 `json:"cost_per_unit"`
		Supplier    string  `json:"supplier"`
		ExpiryDate  string  `json:"expiry_date"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	isLowStock := input.MinStock > 0 && input.Quantity <= input.MinStock

	result, _, err := database.Query("inventory").
		Insert(map[string]interface{}{
			"restaurant_id": restaurantID,
			"name":          input.Name,
			"category":      input.Category,
			"quantity":      input.Quantity,
			"unit":          input.Unit,
			"min_stock":     input.MinStock,
			"cost_per_unit": input.CostPerUnit,
			"supplier":      input.Supplier,
			"expiry_date":   input.ExpiryDate,
		}, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add inventory item"})
		return
	}

	if isLowStock {
		sendLowStockAlert(userID, input.Name, input.Quantity)
	}

	c.JSON(http.StatusCreated, gin.H{"data": result, "message": "Inventory item added successfully"})
}

// UpdateInventoryItem - owner updates an inventory item (ownership verified via join)
func UpdateInventoryItem(c *gin.Context) {
	itemID := c.Param("id")
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	delete(updates, "id")
	delete(updates, "restaurant_id")

	// Verify item belongs to a restaurant this user owns
	_, _, err := database.Query("inventory").
		Select("restaurant_id, restaurants!inner(owner_id)").
		Eq("id", itemID).
		Eq("restaurants.owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or item not found"})
		return
	}

	result, _, err := database.Query("inventory").
		Update(updates, "", "*").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result, "message": "Inventory item updated successfully"})
}

// DeleteInventoryItem - owner deletes an inventory item
func DeleteInventoryItem(c *gin.Context) {
	itemID := c.Param("id")

	_, _, err := database.Query("inventory").Delete("", "").Eq("id", itemID).Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete inventory item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item deleted successfully"})
}

// sendLowStockAlert - notify owner via DB notification + WebSocket
func sendLowStockAlert(userID, itemName string, quantity float64) {
	notification := map[string]interface{}{
		"user_id": userID,
		"title":   "Low Stock Alert",
		"message": fmt.Sprintf("%s is running low (%.2f units remaining)", itemName, quantity),
		"type":    "general",
		"read":    false,
	}

	database.Query("notifications").
		Insert(notification, false, "", "", "").
		Execute()

	realtime.WSHub.SendToUser(userID, map[string]interface{}{
		"type":    "low_stock_alert",
		"payload": notification,
	})
}
