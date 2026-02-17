package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type visitor struct {
	lastSeen time.Time
	count    int
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.RWMutex
)

// Rate limiter middleware
func RateLimiter(requestsPerMinute int) gin.HandlerFunc {
	// Cleanup old visitors every minute
	go func() {
		for {
			time.Sleep(time.Minute)
			mu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > 3*time.Minute {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		mu.Lock()
		v, exists := visitors[ip]
		if !exists {
			visitors[ip] = &visitor{lastSeen: time.Now(), count: 1}
			mu.Unlock()
			c.Next()
			return
		}

		if time.Since(v.lastSeen) > time.Minute {
			v.lastSeen = time.Now()
			v.count = 1
			mu.Unlock()
			c.Next()
			return
		}

		if v.count >= requestsPerMinute {
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
			return
		}

		v.count++
		v.lastSeen = time.Now()
		mu.Unlock()

		c.Next()
	}
}

// API key rate limiter (for restaurant owners with subscriptions)
func APIKeyRateLimiter(requestsPerMinute int) gin.HandlerFunc {
	apiKeyVisitors := make(map[string]*visitor)
	apiKeyMu := sync.RWMutex{}

	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.Next()
			return
		}

		apiKeyMu.Lock()
		v, exists := apiKeyVisitors[apiKey]
		if !exists {
			apiKeyVisitors[apiKey] = &visitor{lastSeen: time.Now(), count: 1}
			apiKeyMu.Unlock()
			c.Next()
			return
		}

		if time.Since(v.lastSeen) > time.Minute {
			v.lastSeen = time.Now()
			v.count = 1
			apiKeyMu.Unlock()
			c.Next()
			return
		}

		if v.count >= requestsPerMinute {
			apiKeyMu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "API rate limit exceeded",
			})
			c.Abort()
			return
		}

		v.count++
		apiKeyMu.Unlock()
		c.Next()
	}
}
