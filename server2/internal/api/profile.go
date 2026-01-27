// server/internal/api/profile.go
package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"yourproject/server/internal/middleware"
	"yourproject/server/internal/repositories"
)

// SetupProfileRoutes registers profile endpoints
func SetupProfileRoutes(r *gin.RouterGroup) {
	profile := r.Group("/profile")
	{
		profile.GET("", getProfileHandler) // Protected
		// Later: PUT /profile for updates
	}
}

// getProfileHandler with Redis caching
func getProfileHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Generate cache key (per user, 5 min TTL)
	cacheKey := cache.GenerateKey("profile", map[string]interface{}{"user": userID})

	// Try cache first
	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var profile map[string]interface{}
		if json.Unmarshal(cached, &profile) == nil {
			c.JSON(http.StatusOK, gin.H{
				"profile": profile,
				"cached":  true,
			})
			return
		}
	}

	// Cache miss → query Supabase
	profile, err := repositories.GetProfile(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if profile == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	// Optional: role-specific data
	role := middleware.GetUserRole(c)
	if role == "restaurant_owner" {
		profile["isOwner"] = true
		// Add restaurant stats if needed in future
	}

	// Store in cache for 5 minutes (profile rarely changes)
	data, _ := json.Marshal(profile)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"profile": profile,
		"cached":  false,
	})
}
