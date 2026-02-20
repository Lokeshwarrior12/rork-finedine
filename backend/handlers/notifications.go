package handlers

import (
	"net/http"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetNotifications - return the latest 50 notifications for the authenticated user
func GetNotifications(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("notifications").
		Select("id, title, message, type, read, restaurant_id, restaurant_name, created_at").
		Eq("user_id", userID).
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Limit(50).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// MarkNotificationRead - mark a single notification as read (must belong to the user)
func MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")
	userID := c.GetString("userId")

	_, _, err := database.Query("notifications").
		Update(map[string]interface{}{"read": true}, "", "").
		Eq("id", notificationID).
		Eq("user_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllNotificationsRead - mark all unread notifications for the user as read
func MarkAllNotificationsRead(c *gin.Context) {
	userID := c.GetString("userId")

	_, _, err := database.Query("notifications").
		Update(map[string]interface{}{"read": true}, "", "").
		Eq("user_id", userID).
		Eq("read", "false").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}
