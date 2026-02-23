package handlers

import (
	"net/http"
	"time"

	"finedine/backend/internal/cache"
	"github.com/supabase-community/postgrest-go"
	"finedine/backend/internal/database"
	"finedine/backend/internal/realtime"

	"github.com/gin-gonic/gin"
)

// GetActiveDeals - public endpoint with Redis cache
func GetActiveDeals(c *gin.Context) {
	cacheKey := cache.DealsKey()

	var cached []map[string]interface{}
	if err := cache.Client.Get(cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
		return
	}

	now := time.Now()

	result, _, err := database.Query("deals").
Select("*, restaurant:restaurants(id, name, logo_url)", "", false).
		Eq("is_active", "true").
		Lte("valid_from", now.Format(time.RFC3339)).
		Gte("valid_until", now.Format(time.RFC3339)).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deals"})
		return
	}

	cache.Client.Set(cacheKey, result, 3*time.Minute)

	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetFeaturedDeals - top deals sorted by discount
func GetFeaturedDeals(c *gin.Context) {
	now := time.Now()

	result, _, err := database.Query("deals").
Select("*, restaurant:restaurants(id, name, logo_url, rating)", "", false).
		Eq("is_active", "true").
		Lte("valid_from", now.Format(time.RFC3339)).
		Gte("valid_until", now.Format(time.RFC3339)).
		Order("discount_percent", &postgrest.OrderOpts{Ascending: false}).
Limit(10, "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch featured deals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateDeal - owner creates a new deal
func CreateDeal(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Verify ownership
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

	input["restaurant_id"] = restaurantID

	result, _, err := database.Query("deals").
		Insert(input, false, "", "*, restaurant:restaurants(name)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deal"})
		return
	}

	cache.Client.Delete(cache.DealsKey())
	realtime.BroadcastNewDeal(result)

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Deal created successfully",
	})
}

// UpdateDeal - owner updates a deal
func UpdateDeal(c *gin.Context) {
	dealID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Prevent overriding the restaurant_id via this endpoint
	delete(updates, "restaurant_id")
	delete(updates, "id")

	result, _, err := database.Query("deals").
		Update(updates, "", "").
		Eq("id", dealID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deal"})
		return
	}

	cache.Client.Delete(cache.DealsKey())

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Deal updated successfully",
	})
}

// DeleteDeal - owner deletes a deal
func DeleteDeal(c *gin.Context) {
	dealID := c.Param("id")

	_, _, err := database.Query("deals").
		Delete("", "").
		Eq("id", dealID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete deal"})
		return
	}

	cache.Client.Delete(cache.DealsKey())

	c.JSON(http.StatusOK, gin.H{"message": "Deal deleted successfully"})
}


