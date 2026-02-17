package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/cache"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

// Get all restaurants with caching
func GetRestaurants(c *gin.Context) {
	cacheKey := cache.RestaurantsListKey("all")
	
	// Try cache first
	var restaurants []map[string]interface{}
	if err := cache.Get(cacheKey, &restaurants); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   restaurants,
			"cached": true,
		})
		return
	}

	// Cache miss - fetch from database
	result, _, err := database.Query("restaurants").
		Select("*").
		Eq("is_open", "true").
		Eq("is_verified", "true").
		Order("rating", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch restaurants"})
		return
	}

	// Cache for 5 minutes
	cache.Set(cacheKey, result, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   result,
		"cached": false,
	})
}

// Get restaurant by ID with caching
func GetRestaurantByID(c *gin.Context) {
	id := c.Param("id")
	cacheKey := cache.RestaurantKey(id)

	// Try cache first
	var restaurant map[string]interface{}
	if err := cache.Get(cacheKey, &restaurant); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   restaurant,
			"cached": true,
		})
		return
	}

	// Fetch from database
	result, _, err := database.Query("restaurants").
		Select("*, menu_items(*)").
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurant not found"})
		return
	}

	// Cache for 10 minutes
	cache.Set(cacheKey, result, 10*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   result,
		"cached": false,
	})
}

// Get nearby restaurants
func GetNearbyRestaurants(c *gin.Context) {
	latitude := c.Query("latitude")
	longitude := c.Query("longitude")
	radius := c.DefaultQuery("radius", "5")

	if latitude == "" || longitude == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing latitude or longitude"})
		return
	}

	cacheKey := fmt.Sprintf("restaurants:nearby:%s:%s:%s", latitude, longitude, radius)

	// Try cache
	var restaurants []map[string]interface{}
	if err := cache.Get(cacheKey, &restaurants); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   restaurants,
			"cached": true,
		})
		return
	}

	// Call RPC function (you need to create this in Supabase)
	result, _, err := database.Client.Rpc("get_nearby_restaurants", "", map[string]interface{}{
		"lat":       latitude,
		"lng":       longitude,
		"radius_km": radius,
	}).Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby restaurants"})
		return
	}

	// Cache for 2 minutes (location data changes frequently)
	cache.Set(cacheKey, result, 2*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   result,
		"cached": false,
	})
}

// Get restaurant menu with caching
func GetRestaurantMenu(c *gin.Context) {
	restaurantID := c.Param("id")
	cacheKey := cache.MenuKey(restaurantID)

	var menu []map[string]interface{}
	if err := cache.Get(cacheKey, &menu); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   menu,
			"cached": true,
		})
		return
	}

	result, _, err := database.Query("menu_items").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Eq("is_available", "true").
		Order("category", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch menu"})
		return
	}

	cache.Set(cacheKey, result, 10*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   result,
		"cached": false,
	})
}

// Search restaurants
func SearchRestaurants(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing search query"})
		return
	}

	result, _, err := database.Query("restaurants").
		Select("*").
		ILike("name", "%"+query+"%").
		Eq("is_open", "true").
		Limit(20).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
