package handlers

import (
	"net/http"
	"time"

	"finedine/backend/internal/cache"
	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// HealthCheck - GET /health
func HealthCheck(c *gin.Context) {
	supabaseOK := database.Client != nil
	redisOK := false

	if cache.Client != nil {
		redisOK = cache.Client.Health() == nil
	}

	status := "ok"
	code := http.StatusOK
	if !supabaseOK || !redisOK {
		status = "degraded"
		code = http.StatusServiceUnavailable
	}

	c.JSON(code, gin.H{
		"status":    status,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"services": gin.H{
			"supabase": supabaseOK,
			"redis":    redisOK,
		},
	})
}

