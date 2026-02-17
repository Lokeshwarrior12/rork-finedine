package handlers

import (
	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
	// Check Supabase connection
	supabaseStatus := "connected"
	if database.Client == nil {
		supabaseStatus = "disconnected"
	}

	// Check Redis connection
	redisStatus := "connected"
	if cache.RedisClient == nil {
		redisStatus = "disconnected"
	} else if err := cache.RedisClient.Ping(c).Err(); err != nil {
		redisStatus = "error"
	}

	c.JSON(200, gin.H{
		"status":    "ok",
		"timestamp": "now",
		"services": gin.H{
			"supabase": supabaseStatus,
			"redis":    redisStatus,
		},
	})
}
