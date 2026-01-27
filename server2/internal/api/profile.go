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

// getProfileHandler handles GET /profile
func getProfileHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	profile, err := repositories.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if profile == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	// Optional: add role-specific data
	role := middleware.GetUserRole(c)
	if role == "restaurant_owner" {
		// Example: fetch restaurant name or stats if needed
		profile["isOwner"] = true
	}

	c.JSON(http.StatusOK, gin.H{
		"profile": profile,
	})
}
