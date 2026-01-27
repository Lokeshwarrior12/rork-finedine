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
func getRestaurantsHandler(c *gin.Context) {
	// Optional query params
	filters := make(map[string]interface{})
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if cuisine := c.Query("cuisine"); cuisine != "" {
		filters["cuisine"] = cuisine
	}

	restaurants, err := repositories.GetRestaurants(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Optional: add role-based extra data (e.g., owners see private fields)
	// role := middleware.GetUserRole(c)
	// if role == "restaurant_owner" { ... }

	c.JSON(http.StatusOK, gin.H{
		"restaurants": restaurants,
		"count":       len(restaurants),
	})
}
