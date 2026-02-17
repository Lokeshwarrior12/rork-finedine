package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"
	"github.com/gin-gonic/gin"
)

// Create order with real-time notification
func CreateOrder(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID string                   `json:"restaurant_id" binding:"required"`
		OrderType    string                   `json:"order_type" binding:"required"`
		Items        []map[string]interface{} `json:"items" binding:"required"`
		Subtotal     float64                  `json:"subtotal" binding:"required"`
		Total        float64                  `json:"total" binding:"required"`
		CouponCode   string                   `json:"coupon_code"`
		Notes        string                   `json:"customer_notes"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Prepare order data
	orderData := map[string]interface{}{
		"customer_id":   userID,
		"restaurant_id": input.RestaurantID,
		"order_type":    input.OrderType,
		"items":         input.Items,
		"subtotal":      input.Subtotal,
		"total":         input.Total,
		"status":        "pending",
		"coupon_code":   input.CouponCode,
		"customer_notes": input.Notes,
	}

	// Create order in database
	result, _, err := database.Query("orders").
		Insert(orderData, false, "", "*, restaurant:restaurants(name, logo_url)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Parse result to get order ID
	var orders []map[string]interface{}
	json.Unmarshal(result, &orders)
	if len(orders) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Order creation failed"})
		return
	}

	order := orders[0]
	orderID := order["id"].(string)

	// Send real-time notification to restaurant owner
	realtime.WSHub.SendToUser(input.RestaurantID, map[string]interface{}{
		"type":    "new_order",
		"payload": order,
	})

	// Publish to Redis for other services
	cache.Publish("orders:new", order)

	c.JSON(http.StatusCreated, gin.H{
		"data":    order,
		"message": "Order created successfully",
	})
}

// Get user orders
func GetUserOrders(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("orders").
		Select("*, restaurant:restaurants(id, name, logo_url)").
		Eq("customer_id", userID).
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Get order by ID
func GetOrderByID(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("orders").
		Select("*, restaurant:restaurants(*)").
		Eq("id", orderID).
		Eq("customer_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Cancel order
func CancelOrder(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetString("userId")

	// Update order status
	result, _, err := database.Query("orders").
		Update(map[string]interface{}{
			"status": "cancelled",
		}, "", "").
		Eq("id", orderID).
		Eq("customer_id", userID).
		Neq("status", "completed").
		Execute()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel order"})
		return
	}

	// Send real-time update
	realtime.SendOrderUpdate(orderID, userID, "cancelled")

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Order cancelled successfully",
	})
}

// Owner: Get restaurant orders
func GetRestaurantOrders(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	status := c.Query("status")

	query := database.Query("orders").
		Select("*, customer:users(id, full_name, phone)").
		Eq("restaurant_id", restaurantID)

	// Verify ownership
	ownerCheck, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if status != "" {
		query = query.Eq("status", status)
	}

	result, _, err := query.
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Update order status with real-time push
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("orderId")
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Verify restaurant ownership
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

	// Update order
	result, _, err := database.Query("orders").
		Update(map[string]interface{}{
			"status": input.Status,
		}, "", "*, customer:users(id)").
		Eq("id", orderID).
		Eq("restaurant_id", restaurantID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	// Parse result to get customer ID
	var orders []map[string]interface{}
	json.Unmarshal(result, &orders)
	if len(orders) > 0 {
		order := orders[0]
		if customer, ok := order["customer"].(map[string]interface{}); ok {
			customerID := customer["id"].(string)

			// Send real-time notification to customer
			realtime.SendOrderUpdate(orderID, customerID, input.Status)

			// Publish to Redis
			cache.Publish("orders:status_update", map[string]interface{}{
				"order_id": orderID,
				"status":   input.Status,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Order status updated",
	})
}
