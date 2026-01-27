// Example with ulule/limiter + Redis store
// server/internal/middleware/ratelimit.go
package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	limiter "github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memorystore"
)

// RateLimitMiddleware limits requests per IP
func RateLimitMiddleware() gin.HandlerFunc {
	// 100 requests per minute per IP (adjust as needed)
	rate, err := limiter.NewRateFromFormatted("100-M")
	if err != nil {
		panic(err) // or handle gracefully
	}

	store := memorystore.New(memorystore.Options{
		Prefix: "ratelimit",
	})

	rateLimiter := limiter.New(store, rate)

	middleware := mgin.NewMiddleware(rateLimiter, mgin.WithKeyGetter(func(c *gin.Context) string {
		// Use IP as key (can change to userID after auth if you want per-user limits)
		return c.ClientIP()
	}))

	return middleware
}
