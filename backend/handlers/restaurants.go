package handlers

import (
	"fmt"
	"net/http"
	"time"

	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetRestaurants - public list of open verified restaurants with caching
func GetRestaurants(c *gin.Context) {
	cacheKey := cache.RestaurantsListKey("all")

	var cached []map[string]interface{}
	if err := cache.Get(cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
		return
	}

	result, _, err := database.Query("restaurants").
		Select("id, name, description, cuisine_type, address, city, logo_url, images, rating, review_count, opening_hours, waiting_time, categories, accepts_table_booking, is_open, is_verified").
		Eq("is_open", "true").
		Eq("is_verified", "true").
		Order("rating", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch restaurants"})
		return
	}

	cache.Set(cacheKey, result, 5*time.Minute)
	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetRestaurantByID - single restaurant with menu embedded
func GetRestaurantByID(c *gin.Context) {
	id := c.Param("id")
	cacheKey := cache.RestaurantKey(id)

	var cached map[string]interface{}
	if err := cache.Get(cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
		return
	}

	result, _, err := database.Query("restaurants").
		Select("*, menu_items(*)").
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurant not found"})
		return
	}

	cache.Set(cacheKey, result, 10*time.Minute)
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

	var cached []map[string]interface{}
	if err := cache.Get(cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
		return
	}

	result, _, err := database.Client.Rpc("get_nearby_restaurants", "", map[string]interface{}{
		"lat":       latitude,
		"lng":       longitude,
		"radius_km": radius,
	}).Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby restaurants"})
		return
	}

	// Location data expires quickly
	cache.Set(cacheKey, result, 2*time.Minute)
	c.JSON(http.StatusOK, gin.H{"data": result, "cached": false})
}

// GetRestaurantMenu - available menu items for a restaurant
func GetRestaurantMenu(c *gin.Context) {
	restaurantID := c.Param("id")
	cacheKey := cache.MenuKey(restaurantID)

	var cached []map[string]interface{}
	if err := cache.Get(cacheKey, &cached); err == nil {
		c.JSON(http.StatusOK, gin.H{"data": cached, "cached": true})
		return
	}

	result, _, err := database.Query("menu_items").
		Select("id, name, description, price, category, image, is_available, is_vegetarian, is_vegan, is_gluten_free, spice_level, preparation_time").
		Eq("restaurant_id", restaurantID).
		Eq("is_available", "true").
		Order("category", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch menu"})
		return
	}

	cache.Set(cacheKey, result, 10*time.Minute)
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
		Select("id, name, description, cuisine_type, address, city, logo_url, rating, review_count, opening_hours, waiting_time, categories, is_open").
		Eq("is_open", "true").
		Eq("is_verified", "true")

	if q != "" {
		query = query.ILike("name", "%"+q+"%")
	}
	if cuisineType != "" {
		query = query.Eq("cuisine_type", cuisineType)
	}
	if category != "" {
		query = query.Contains("categories", "[\""+category+"\"]")
	}

	result, _, err := query.
		Order("rating", &database.OrderOpts{Ascending: false}).
		Limit(20).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Create restaurant
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

	// Bust list cache so new restaurant appears after verification
	cache.Delete(cache.RestaurantsListKey("all"))

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Restaurant created successfully. Pending verification.",
	})
}

// Owner: Update restaurant
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
		Select("id").
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

	// Bust both caches
	cache.Delete(cache.RestaurantKey(restaurantID))
	cache.Delete(cache.RestaurantsListKey("all"))

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Restaurant updated successfully",
	})
}

// Owner: Add menu item
func AddMenuItem(c *gin.Context) {
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

	cache.Delete(cache.MenuKey(restaurantID))

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Menu item added successfully",
	})
}

// Owner: Update menu item
func UpdateMenuItem(c *gin.Context) {
	itemID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

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

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// Owner: Delete menu item
func DeleteMenuItem(c *gin.Context) {
	itemID := c.Param("id")

	// Fetch restaurant_id first so we can bust the menu cache
	existing, _, err := database.Query("menu_items").
		Select("restaurant_id").
		Eq("id", itemID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Menu item not found"})
		return
	}

	_, _, err = database.Query("menu_items").
		Delete("", "").
		Eq("id", itemID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete menu item"})
		return
	}

	// Bust menu cache if we can extract the restaurant id
	var item map[string]interface{}
	if existing != nil {
		if rid, ok := item["restaurant_id"].(string); ok {
			cache.Delete(cache.MenuKey(rid))
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu item deleted successfully"})
}
