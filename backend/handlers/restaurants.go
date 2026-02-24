package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/postgrest-go"
)

// GetRestaurants - public list of open verified restaurants with caching
func GetRestaurants(c *gin.Context) {
	// Try cache first (safe even if Redis is nil)
	var cached []map[string]interface{}
	cacheKey := cache.RestaurantsListKey("all")
	
	if cache.Client != nil {
		if err := cache.Client.Get(cacheKey, &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
			return
		}
	}

	// Cache miss or no Redis - fetch from database
	result, _, err := database.Query("restaurants").
		Select("id, name, description, cuisine_type, address, city, logo_url, images, rating, review_count, opening_hours, waiting_time, categories, accepts_table_booking, is_open, is_verified", "", false).
		Eq("is_open", "true").
		Eq("is_verified", "true").
		Order("rating", &postgrest.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch restaurants"})
		return
	}

	// Cache result (silently skips if no Redis)
	if cache.Client != nil {
		cache.Client.Set(cacheKey, result, 5*time.Minute)
	}

	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetRestaurantByID - single restaurant with menu embedded
func GetRestaurantByID(c *gin.Context) {
	id := c.Param("id")
	cacheKey := cache.RestaurantKey(id)

	// Try cache first
	var cached map[string]interface{}
	if cache.Client != nil {
		if err := cache.Client.Get(cacheKey, &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
			return
		}
	}

	// Fetch from database
	result, _, err := database.Query("restaurants").
		Select("*, menu_items(*)", "", false).
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurant not found"})
		return
	}

	// Cache result
	if cache.Client != nil {
		cache.Client.Set(cacheKey, result, 10*time.Minute)
	}

	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetNearbyRestaurants - location-based search via Supabase RPC
func GetNearbyRestaurants(c *gin.Context) {
	latitude := c.Query("latitude")
	longitude := c.Query("longitude")
	radius := c.DefaultQuery("radius", "5")

	if latitude == "" || longitude == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "latitude and longitude are required"})
		return
	}

	cacheKey := fmt.Sprintf("restaurants:nearby:%s:%s:%s", latitude, longitude, radius)

	// Try cache first
	var cached []map[string]interface{}
	if cache.Client != nil {
		if err := cache.Client.Get(cacheKey, &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
			return
		}
	}

	// Call Supabase RPC function
	resultStr := database.Client.Rpc("get_nearby_restaurants", "", map[string]interface{}{
		"lat":       latitude,
		"lng":       longitude,
		"radius_km": radius,
	})

	var result []map[string]interface{}
	err := json.Unmarshal([]byte(resultStr), &result)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby restaurants"})
		return
	}

	// Cache for 2 minutes (location data expires quickly)
	if cache.Client != nil {
		cache.Client.Set(cacheKey, result, 2*time.Minute)
	}

	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetRestaurantMenu - available menu items for a restaurant
func GetRestaurantMenu(c *gin.Context) {
	restaurantID := c.Param("id")
	cacheKey := cache.MenuKey(restaurantID)

	// Try cache first
	var cached []map[string]interface{}
	if cache.Client != nil {
		if err := cache.Client.Get(cacheKey, &cached); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
			return
		}
	}

	// Fetch from database
	result, _, err := database.Query("menu_items").
		Select("id, name, description, price, category, image, is_available, is_vegetarian, is_vegan, is_gluten_free, spice_level, preparation_time", "", false).
		Eq("restaurant_id", restaurantID).
		Eq("is_available", "true").
		Order("category", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch menu"})
		return
	}

	// Cache result
	if cache.Client != nil {
		cache.Client.Set(cacheKey, result, 10*time.Minute)
	}

	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// SearchRestaurants - full-text search across name, cuisine, and categories
func SearchRestaurants(c *gin.Context) {
	q := c.Query("q")
	cuisineType := c.Query("cuisine")
	category := c.Query("category")

	if q == "" && cuisineType == "" && category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one search parameter is required (q, cuisine, category)"})
		return
	}

	query := database.Query("restaurants").
		Select("id, name, description, cuisine_type, address, city, logo_url, rating, review_count, opening_hours, waiting_time, categories, is_open", "", false).
		Eq("is_open", "true").
		Eq("is_verified", "true")

	if q != "" {
		query = query.Ilike("name", "%"+q+"%")
	}
	if cuisineType != "" {
		query = query.Eq("cuisine_type", cuisineType)
	}
	if category != "" {
		query = query.Contains("categories", []string{category})
	}

	result, _, err := query.
		Order("rating", &postgrest.OrderOpts{Ascending: false}).
		Limit(20, "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateRestaurant - Owner creates a new restaurant
func CreateRestaurant(c *gin.Context) {
	userID := c.GetString("userId")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	input["owner_id"] = userID
	input["is_verified"] = false
	input["is_open"] = false
	input["rating"] = 0
	input["review_count"] = 0

	result, _, err := database.Query("restaurants").
		Insert(input, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create restaurant"})
		return
	}

	// Bust list cache
	if cache.Client != nil {
		cache.Client.Delete(cache.RestaurantsListKey("all"))
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Restaurant created successfully. Pending verification.",
	})
}

// UpdateRestaurant - Owner updates their restaurant
func UpdateRestaurant(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Guard immutable fields
	delete(updates, "id")
	delete(updates, "owner_id")
	delete(updates, "is_verified")
	delete(updates, "rating")
	delete(updates, "review_count")

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

	result, _, err := database.Query("restaurants").
		Update(updates, "", "*").
		Eq("id", restaurantID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update restaurant"})
		return
	}

	// Bust caches
	if cache.Client != nil {
		cache.Client.Delete(cache.RestaurantKey(restaurantID))
		cache.Client.Delete(cache.RestaurantsListKey("all"))
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Restaurant updated successfully",
	})
}

// AddMenuItem - Owner adds menu item to their restaurant
func AddMenuItem(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

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

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	input["restaurant_id"] = restaurantID

	result, _, err := database.Query("menu_items").
		Insert(input, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add menu item"})
		return
	}

	// Bust menu cache
	if cache.Client != nil {
		cache.Client.Delete(cache.MenuKey(restaurantID))
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Menu item added successfully",
	})
}

// UpdateMenuItem - Owner updates a menu item
func UpdateMenuItem(c *gin.Context) {
	itemID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Guard immutable fields
	delete(updates, "id")
	delete(updates, "restaurant_id")

	result, _, err := database.Query("menu_items").
		Update(updates, "", "*").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update menu item"})
		return
	}

	// Note: We can't easily bust the cache here without querying for restaurant_id first
	// Consider adding it if performance matters

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Menu item updated successfully",
	})
}

// DeleteMenuItem - Owner deletes a menu item
func DeleteMenuItem(c *gin.Context) {
	itemID := c.Param("id")

	// Fetch restaurant_id first so we can bust the cache
	existing, _, err := database.Query("menu_items").
		Select("restaurant_id", "", false).
		Eq("id", itemID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Menu item not found"})
		return
	}

	// Delete the item
	_, _, err = database.Query("menu_items").
		Delete("", "").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu item"})
		return
	}

	// Bust menu cache
	if cache.Client != nil && existing != nil {
		if item, ok := existing.(map[string]interface{}); ok {
			if rid, ok := item["restaurant_id"].(string); ok {
				cache.Client.Delete(cache.MenuKey(rid))
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu item deleted successfully"})
}
