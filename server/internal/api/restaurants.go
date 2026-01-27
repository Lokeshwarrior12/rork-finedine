package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"finedine-server/internal/cache"
	"finedine-server/internal/repositories"
)

func getRestaurantsHandler(c *gin.Context) {
	filters := make(map[string]interface{})
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if cuisine := c.Query("cuisine"); cuisine != "" {
		filters["cuisine"] = cuisine
	}

	cacheKey := cache.GenerateKey("restaurants", filters)

	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var result []repositories.Restaurant
		if json.Unmarshal(cached, &result) == nil {
			c.JSON(http.StatusOK, gin.H{
				"restaurants": result,
				"count":       len(result),
				"cached":      true,
			})
			return
		}
	}

	restaurants, err := repositories.GetRestaurants(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	data, _ := json.Marshal(restaurants)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"count":       len(restaurants),
		"cached":      false,
	})
}

func getRestaurantByIDHandler(c *gin.Context) {
	id := c.Param("id")

	cacheKey := cache.GenerateKey("restaurant", map[string]interface{}{"id": id})

	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var result repositories.Restaurant
		if json.Unmarshal(cached, &result) == nil {
			c.JSON(http.StatusOK, gin.H{
				"restaurant": result,
				"cached":     true,
			})
			return
		}
	}

	restaurant, err := repositories.GetRestaurantByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if restaurant == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurant not found"})
		return
	}

	data, _ := json.Marshal(restaurant)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"restaurant": restaurant,
		"cached":     false,
	})
}
