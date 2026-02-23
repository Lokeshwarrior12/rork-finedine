package handlers

import (
	"encoding/json"
	"net/http"

	"finedine/backend/internal/cache"
	"github.com/supabase-community/postgrest-go"
	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"

	"github.com/gin-gonic/gin"
)

// CreateOrder - authenticated user places an order
func CreateOrder(c *gin.Context) {
	userID := c.GetString("userId")

	var input struct {
		RestaurantID  string                   `json:"restaurant_id" binding:"required"`
		OrderType     string                   `json:"order_type" binding:"required,oneof=dine_in takeaway delivery"`
		Items         []map[string]interface{} `json:"items" binding:"required,min=1"`
		Subtotal      float64                  `json:"subtotal" binding:"required,gt=0"`
		Total         float64                  `json:"total" binding:"required,gt=0"`
		CouponCode    string                   `json:"coupon_code"`
		CustomerNotes string                   `json:"customer_notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	orderData := map[string]interface{}{
		"customer_id":    userID,
		"restaurant_id":  input.RestaurantID,
		"order_type":     input.OrderType,
		"items":          input.Items,
		"subtotal":       input.Subtotal,
		"total":          input.Total,
		"status":         "pending",
		"coupon_code":    input.CouponCode,
		"customer_notes": input.CustomerNotes,
	}

	result, _, err := database.Query("orders").
		Insert(orderData, false, "", "*, restaurant:restaurants(name, logo_url)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	var orders []map[string]interface{}
	if err := json.Unmarshal(result, &orders); err != nil || len(orders) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Order creation failed"})
		return
	}

	order := orders[0]

	// Real-time notification to restaurant owner
	realtime.WSHub.SendToUser(input.RestaurantID, map[string]interface{}{
		"type":    "new_order",
		"payload": order,
	})

	// Publish to Redis for downstream services
	cache.Client.Publish("orders:new", order)

	c.JSON(http.StatusCreated, gin.H{
		"data":    order,
		"message": "Order created successfully",
	})
}

// GetUserOrders - list the authenticated user's order history
func GetUserOrders(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("orders").
Select("*, restaurant:restaurants(id, name, logo_url)", "", false).
		Eq("customer_id", userID).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// GetOrderByID - single order detail (must belong to the requesting user)
func GetOrderByID(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("orders").
Select("*, restaurant:restaurants(*)", "", false).
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

// CancelOrder - customer cancels a non-completed order
func CancelOrder(c *gin.Context) {
	orderID := c.Param("id")
	userID := c.GetString("userId")

	result, _, err := database.Query("orders").
		Update(map[string]interface{}{"status": "cancelled"}, "", "").
		Eq("id", orderID).
		Eq("customer_id", userID).
		Neq("status", "completed").
		Execute()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot cancel this order"})
		return
	}

	realtime.SendOrderUpdate(orderID, userID, "cancelled")

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Order cancelled successfully",
	})
}

// GetRestaurantOrders - owner views orders for their restaurant
func GetRestaurantOrders(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")
	status := c.Query("status")

	// Verify ownership first
	_, _, err := database.Query("restaurants").
Select("id", "", false).
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	query := database.Query("orders").
Select("*, customer:users(id, full_name, phone)", "", false).
		Eq("restaurant_id", restaurantID)

	if status != "" {
		query = query.Eq("status", status)
	}

	result, _, err := query.
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// UpdateOrderStatus - owner updates status and pushes real-time to customer
func UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("orderId")
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input struct {
		Status string `json:"status" binding:"required,oneof=pending confirmed preparing ready completed cancelled"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status value"})
		return
	}

	// Verify restaurant ownership
	_, _, err := database.Query("restaurants").
Select("id", "", false).
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("orders").
		Update(map[string]interface{}{"status": input.Status}, "", "*, customer:users(id)").
		Eq("id", orderID).
		Eq("restaurant_id", restaurantID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order"})
		return
	}

	// Push real-time update to customer
	var orders []map[string]interface{}
	if err := json.Unmarshal(result, &orders); err == nil && len(orders) > 0 {
		order := orders[0]
		if customer, ok := order["customer"].(map[string]interface{}); ok {
			if customerID, ok := customer["id"].(string); ok {
				realtime.SendOrderUpdate(orderID, customerID, input.Status)
				cache.Client.Publish("orders:status_update", map[string]interface{}{
					"order_id": orderID,
					"status":   input.Status,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Order status updated",
	})
}



