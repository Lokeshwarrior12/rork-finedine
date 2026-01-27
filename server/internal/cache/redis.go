package cache

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

func Init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = os.Getenv("REDIS_REST_URL")
	}
	redisToken := os.Getenv("REDIS_REST_TOKEN")

	if redisURL == "" {
		fmt.Println("Warning: Redis not configured - caching disabled")
		return
	}

	opts := &redis.Options{
		Addr: redisURL,
		DB:   0,
	}

	if redisToken != "" {
		opts.Password = redisToken
	}

	redisClient = redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		fmt.Printf("Redis connection failed: %v\n", err)
		redisClient = nil
	} else {
		fmt.Println("Redis connected successfully")
	}
}

func Get(ctx context.Context, key string) ([]byte, error) {
	if redisClient == nil {
		return nil, nil
	}
	result, err := redisClient.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	fmt.Printf("[Cache] Hit for key: %s\n", key)
	return result, nil
}

func Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	if redisClient == nil {
		return nil
	}
	fmt.Printf("[Cache] Stored key: %s\n", key)
	return redisClient.Set(ctx, key, value, ttl).Err()
}

func Delete(ctx context.Context, key string) error {
	if redisClient == nil {
		return nil
	}
	return redisClient.Del(ctx, key).Err()
}

func GenerateKey(prefix string, params map[string]interface{}) string {
	key := prefix
	for k, v := range params {
		key += fmt.Sprintf(":%s:%v", k, v)
	}
	return key
}
