package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

/*
-----------------------------------------------------
REDIS CLIENT WRAPPER
-----------------------------------------------------
- Safe for high concurrency
- URL-based config
- Optional global singleton
*/

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

// Optional global instance (convenience)
var Client *RedisClient

/*
-----------------------------------------------------
INITIALIZATION
-----------------------------------------------------
*/

func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}

	rc, err := NewRedisClient(redisURL)
	if err != nil {
		log.Printf("⚠️  Redis connection failed: %v (continuing without cache)", err)
		return
	}

	Client = rc
	log.Println("✅ Redis connected successfully")
}

func NewRedisClient(redisURL string) (*RedisClient, error) {
	if redisURL == "" {
		return nil, fmt.Errorf("redis URL is required")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	// Performance tuning
	opt.PoolSize = 100        // Handles 1000+ concurrent users
	opt.MinIdleConns = 10
	opt.MaxRetries = 3

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Health check
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

/*
-----------------------------------------------------
CACHE OPERATIONS
-----------------------------------------------------
*/

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, key, data, expiration).Err()
}

func (r *RedisClient) Get(key string, dest interface{}) error {
	val, err := r.client.Get(r.ctx, key).Result()
	if err == redis.Nil {
		return fmt.Errorf("key not found: %s", key)
	}
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) Exists(key string) (bool, error) {
	val, err := r.client.Exists(r.ctx, key).Result()
	return val > 0, err
}

func (r *RedisClient) Incr(key string) error {
	return r.client.Incr(r.ctx, key).Err()
}

func (r *RedisClient) Expire(key string, expiration time.Duration) error {
	return r.client.Expire(r.ctx, key, expiration).Err()
}

/*
-----------------------------------------------------
PUB / SUB (REAL-TIME)
-----------------------------------------------------
*/

func (r *RedisClient) Publish(channel string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}
	return r.client.Publish(r.ctx, channel, data).Err()
}

func (r *RedisClient) Subscribe(channel string, handler func(message string)) {
	pubsub := r.client.Subscribe(r.ctx, channel)
	defer pubsub.Close()

	for msg := range pubsub.Channel() {
		handler(msg.Payload)
	}
}

/*
-----------------------------------------------------
HEALTH & LIFECYCLE
-----------------------------------------------------
*/

func (r *RedisClient) Health() error {
	return r.client.Ping(r.ctx).Err()
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

func (r *RedisClient) GetClient() *redis.Client {
	return r.client
}

/*
-----------------------------------------------------
CACHE KEY HELPERS
-----------------------------------------------------
*/

func RestaurantKey(id string) string {
	return "restaurant:" + id
}

func RestaurantsListKey(filter string) string {
	return "restaurants:list:" + filter
}

func MenuKey(restaurantID string) string {
	return "menu:" + restaurantID
}

func OrderKey(id string) string {
	return "order:" + id
}

func DealsKey() string {
	return "deals:active"
}
