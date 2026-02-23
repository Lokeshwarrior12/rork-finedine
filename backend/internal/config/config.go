// backend/internal/config/config.go
package config

import (
	"os"
)

type Config struct {
	Environment        string
	Port               string
	DatabaseURL        string
	RedisURL           string
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseJWTSecret  string
	StripeSecretKey    string
	StripeWebhookSecret string
	FCMServerKey       string
	GoogleMapsAPIKey   string
	FrontendURL        string
}

func Load() *Config {
	return &Config{
		Environment:        getEnv("ENVIRONMENT", "development"),
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		RedisURL:           getEnv("REDIS_URL", ""),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", ""),
		StripeSecretKey:    getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		FCMServerKey:       getEnv("FCM_SERVER_KEY", ""),
		GoogleMapsAPIKey:   getEnv("GOOGLE_MAPS_API_KEY", ""),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:8081"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
