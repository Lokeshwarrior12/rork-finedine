package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"finedine-server/internal/cache"
	"finedine-server/internal/middleware"
	"finedine-server/internal/repositories"
)

func getProfileHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cacheKey := cache.GenerateKey("profile", map[string]interface{}{"user": userID})

	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var profile repositories.Profile
		if json.Unmarshal(cached, &profile) == nil {
			c.JSON(http.StatusOK, gin.H{
				"profile": profile,
				"cached":  true,
			})
			return
		}
	}

	profile, err := repositories.GetProfile(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if profile == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	data, _ := json.Marshal(profile)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"profile": profile,
		"cached":  false,
	})
}

func updateProfileHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	delete(updates, "id")
	delete(updates, "email")
	delete(updates, "role")

	ctx := c.Request.Context()
	profile, err := repositories.UpdateProfile(ctx, userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cacheKey := cache.GenerateKey("profile", map[string]interface{}{"user": userID})
	cache.Delete(ctx, cacheKey)

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}
