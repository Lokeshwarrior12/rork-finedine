package handlers

import (
	"net/http"
	"time"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/cache"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/realtime"
	"github.com/gin-gonic/gin"
)

// Get active deals with caching
func GetActiveDeals(c *gin.Context) {
	cacheKey := cache.DealsKey()

	var deals []map[string]interface{}
	if err := cache.Get(cacheKey, &deals); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   deals,
			"cached": true,
		})
		return
	}

	now := time.Now()

	result, _, err := database.Query("deals").
		Select("*, restaurant:restaurants(id, name, logo_url)").
		Eq("is_active", "true").
		Lte("valid_from", now.Format(time.RFC3339)).
		Gte("valid_until", now.Format(time.RFC3339)).
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deals"})
		return
	}

	// Cache for 3 minutes
	cache.Set(cacheKey, result, 3*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   result,
		"cached": false,
	})
}

// Get featured deals
func GetFeaturedDeals(c *gin.Context) {
	now := time.Now()

	result, _, err := database.Query("deals").
		Select("*, restaurant:restaurants(id, name, logo_url, rating)").
		Eq("is_active", "true").
		Lte("valid_from", now.Format(time.RFC3339)).
		Gte("valid_until", now.Format(time.RFC3339)).
		Order("discount_percent", &database.OrderOpts{Ascending: false}).
		Limit(10).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch featured deals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Create deal
func CreateDeal(c *gin.Context) {
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

	result, _, err := database.Query("deals").
		Insert(input, false, "", "*, restaurant:restaurants(name)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deal"})
		return
	}

	// Invalidate cache
	cache.Delete(cache.DealsKey())

	// Broadcast new deal to all users
	realtime.BroadcastNewDeal(result)

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Deal created successfully",
	})
}

// Owner: Update deal
func UpdateDeal(c *gin.Context) {
	dealID := c.Param("id")
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.BindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Verify ownership via restaurant
	result, _, err := database.Query("deals").
		Update(updates, "", "").
		Eq("id", dealID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deal"})
		return
	}

	cache.Delete(cache.DealsKey())

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Delete deal
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

	cache.Delete(cache.DealsKey())

	c.JSON(http.StatusOK, gin.H{"message": "Deal deleted successfully"})
}
