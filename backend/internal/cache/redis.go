package cache

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

// Initialize Redis connection
func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:         redisURL,
		Password:     os.Getenv("REDIS_PASSWORD"),
		DB:           0,
		PoolSize:     100, // Important for 1000+ concurrent users
		MinIdleConns: 10,
		MaxRetries:   3,
	})

	// Test connection
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️  Redis connection failed: %v (continuing without cache)", err)
	} else {
		log.Println("✅ Redis connected successfully")
	}
}

// Cache helpers
func Set(key string, value interface{}, expiration time.Duration) error {
	json, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return RedisClient.Set(ctx, key, json, expiration).Err()
}

func Get(key string, dest interface{}) error {
	val, err := RedisClient.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func Delete(key string) error {
	return RedisClient.Del(ctx, key).Err()
}

func Exists(key string) bool {
	val, _ := RedisClient.Exists(ctx, key).Result()
	return val > 0
}

// Pub/Sub for real-time updates
func Publish(channel string, message interface{}) error {
	json, err := json.Marshal(message)
	if err != nil {
		return err
	}
	return RedisClient.Publish(ctx, channel, json).Err()
}

func Subscribe(channel string, handler func(message string)) {
	pubsub := RedisClient.Subscribe(ctx, channel)
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		handler(msg.Payload)
	}
}

// Cache keys helpers
func RestaurantKey(id string) string {
	return "restaurant:" + id
}

func RestaurantsListKey(filter string) string {
	return "restaurants:list:" + filter
}

func OrderKey(id string) string {
	return "order:" + id
}

func MenuKey(restaurantID string) string {
	return "menu:" + restaurantID
}

func DealsKey() string {
	return "deals:active"
}
