package handlers

import (
	"net/http"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetProfile - return the authenticated user's profile
func GetProfile(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("users").
		Select("id, email, full_name, phone, address, role, points, favorites, cuisine_preferences, restaurant_id, created_at").
		Eq("id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// UpdateProfile - update mutable profile fields only
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Block fields users must not self-modify
	immutable := []string{"id", "email", "role", "password_hash", "restaurant_id", "points", "created_at"}
	for _, field := range immutable {
		delete(updates, field)
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid fields to update"})
		return
	}

	result, _, err := database.Query("users").
		Update(updates, "", "id, email, full_name, phone, address, role, points, favorites, cuisine_preferences, restaurant_id").
		Eq("id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Profile updated successfully",
	})
}
