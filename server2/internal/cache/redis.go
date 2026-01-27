// server/internal/cache/redis.go
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

func Init() {
	redisURL := os.Getenv("REDIS_REST_URL")
	redisToken := os.Getenv("REDIS_REST_TOKEN")

	if redisURL == "" || redisToken == "" {
		fmt.Println("Warning: Redis not configured - caching disabled")
		return
	}

	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisURL, // Upstash uses REST, but go-redis supports it via URL
		Password: redisToken,
		DB:       0,
	})

	// Test connection
	_, err := redisClient.Ping(context.Background()).Result()
	if err != nil {
		fmt.Printf("Redis connection failed: %v\n", err)
		redisClient = nil // disable caching on failure
	} else {
		fmt.Println("Redis connected successfully")
	}
}

// Get cached data – returns nil if not found or error
func Get(ctx context.Context, key string) ([]byte, error) {
	if redisClient == nil {
		return nil, nil
	}
	if cached != nil {
		fmt.Printf("[Cache] Hit for key: %s\n", key)
	}
	return redisClient.Get(ctx, key).Bytes()
}

// Set cache with TTL (e.g., 5 minutes)
func Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	if redisClient == nil {
		return nil
	}
	fmt.Printf("[Cache] Stored key: %s\n", key)
	return redisClient.Set(ctx, key, value, ttl).Err()
}

// Generate cache key (e.g., "restaurants:city:Irving:cuisine:Italian")
func GenerateKey(prefix string, params map[string]interface{}) string {
	key := prefix
	for k, v := range params {
		key += fmt.Sprintf(":%s:%v", k, v)
	}
	return key
}
