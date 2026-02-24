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
REDIS CLIENT WRAPPER - CRASH-PROOF VERSION
-----------------------------------------------------
- Safe for high concurrency
- Gracefully handles missing Redis
- Never crashes on nil pointer
*/

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

// Global instance (can be nil if Redis unavailable)
var Client *RedisClient

/*
-----------------------------------------------------
INITIALIZATION
-----------------------------------------------------
*/

func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	
	// If no Redis URL or explicitly disabled, skip Redis
	if redisURL == "" || redisURL == "disabled" {
		log.Println("⚠️  REDIS_URL not set - caching disabled")
		Client = nil
		return
	}

	rc, err := NewRedisClient(redisURL)
	if err != nil {
		log.Printf("⚠️  Redis connection failed: %v (continuing without cache)", err)
		Client = nil
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
	opt.PoolSize = 100
	opt.MinIdleConns = 10
	opt.MaxRetries = 3
	opt.DialTimeout = 5 * time.Second
	opt.ReadTimeout = 3 * time.Second
	opt.WriteTimeout = 3 * time.Second

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Health check with timeout
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

/*
-----------------------------------------------------
SAFE CACHE OPERATIONS - NEVER CRASH ON NIL
-----------------------------------------------------
*/

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	if r == nil || r.client == nil {
		return nil // Silently skip if no Redis
	}

	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return r.client.Set(r.ctx, key, data, expiration).Err()
}

func (r *RedisClient) Get(key string, dest interface{}) error {
	if r == nil || r.client == nil {
		return fmt.Errorf("cache miss: Redis not available")
	}

	val, err := r.client.Get(r.ctx, key).Result()
	if err == redis.Nil {
		return fmt.Errorf("key not found: %s", key)
	}
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), dest)
}

func (r *RedisClient) GetString(key string) (string, error) {
	if r == nil || r.client == nil {
		return "", fmt.Errorf("cache miss: Redis not available")
	}

	return r.client.Get(r.ctx, key).Result()
}

func (r *RedisClient) SetString(key string, value string, expiration time.Duration) error {
	if r == nil || r.client == nil {
		return nil
	}

	return r.client.Set(r.ctx, key, value, expiration).Err()
}

func (r *RedisClient) Delete(key string) error {
	if r == nil || r.client == nil {
		return nil
	}

	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) DeletePattern(pattern string) error {
	if r == nil || r.client == nil {
		return nil
	}

	iter := r.client.Scan(r.ctx, 0, pattern, 0).Iterator()
	for iter.Next(r.ctx) {
		if err := r.client.Del(r.ctx, iter.Val()).Err(); err != nil {
			return err
		}
	}

	return iter.Err()
}

func (r *RedisClient) Exists(key string) (bool, error) {
	if r == nil || r.client == nil {
		return false, nil
	}

	val, err := r.client.Exists(r.ctx, key).Result()
	return val > 0, err
}

func (r *RedisClient) Incr(key string) error {
	if r == nil || r.client == nil {
		return nil
	}

	return r.client.Incr(r.ctx, key).Err()
}

func (r *RedisClient) Expire(key string, expiration time.Duration) error {
	if r == nil || r.client == nil {
		return nil
	}

	return r.client.Expire(r.ctx, key, expiration).Err()
}

/*
-----------------------------------------------------
PUB / SUB (REAL-TIME)
-----------------------------------------------------
*/

func (r *RedisClient) Publish(channel string, message interface{}) error {
	if r == nil || r.client == nil {
		return nil
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	return r.client.Publish(r.ctx, channel, data).Err()
}

func (r *RedisClient) Subscribe(channel string, handler func(message string)) {
	if r == nil || r.client == nil {
		log.Printf("⚠️  Cannot subscribe to channel %s: Redis not available", channel)
		return
	}

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
	if r == nil || r.client == nil {
		return fmt.Errorf("Redis not initialized")
	}

	return r.client.Ping(r.ctx).Err()
}

func (r *RedisClient) Close() error {
	if r == nil || r.client == nil {
		return nil
	}

	return r.client.Close()
}

func (r *RedisClient) GetClient() *redis.Client {
	if r == nil {
		return nil
	}
	return r.client
}

func (r *RedisClient) IsAvailable() bool {
	return r != nil && r.client != nil
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

/*
-----------------------------------------------------
GLOBAL HELPER FUNCTIONS (SAFE TO CALL EVEN IF NIL)
-----------------------------------------------------
*/

// SafeGet - returns error if cache miss or Redis unavailable
func SafeGet(key string, dest interface{}) error {
	if Client == nil {
		return fmt.Errorf("cache unavailable")
	}
	return Client.Get(key, dest)
}

// SafeSet - silently skips if Redis unavailable
func SafeSet(key string, value interface{}, expiration time.Duration) {
	if Client != nil {
		Client.Set(key, value, expiration)
	}
}

// SafeDelete - silently skips if Redis unavailable
func SafeDelete(key string) {
	if Client != nil {
		Client.Delete(key)
	}
}
