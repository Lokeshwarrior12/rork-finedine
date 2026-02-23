package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Request logger middleware
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Process request
		c.Next()

		// Log after request
		latency := time.Since(startTime)
		statusCode := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path

		log.Printf(
			"[%s] %s %s | Status: %d | Latency: %v",
			method,
			path,
			c.ClientIP(),
			statusCode,
			latency,
		)
	}
}
