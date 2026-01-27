// server/internal/api/restaurants.go
package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"yourproject/server/internal/middleware"
	"yourproject/server/internal/repositories"
)

// SetupRestaurantsRoutes registers restaurant endpoints
func SetupRestaurantsRoutes(r *gin.RouterGroup) {
	restaurants := r.Group("/restaurants")
	{
		// Public route: anyone can list restaurants (no auth required)
		restaurants.GET("", getRestaurantsHandler)
		// Later: protected routes like create/update for owners
	}
}

// getRestaurantsHandler handles GET /restaurants
// getRestaurantsHandler with Redis caching
func getRestaurantsHandler(c *gin.Context) {
	// Build filters from query params
	filters := make(map[string]interface{})
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if cuisine := c.Query("cuisine"); cuisine != "" {
		filters["cuisine"] = cuisine
	}

	// Generate cache key
	cacheKey := cache.GenerateKey("restaurants", filters)

	// Try cache first
	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var result []map[string]interface{}
		if json.Unmarshal(cached, &result) == nil {
			c.JSON(http.StatusOK, gin.H{
				"restaurants": result,
				"count":       len(result),
				"cached":      true,
			})
			return
		}
	}

	// Cache miss → query Supabase
	restaurants, err := repositories.GetRestaurants(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store in cache for 5 minutes
	data, _ := json.Marshal(restaurants)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"count":       len(restaurants),
		"cached":      false,
	})
}
