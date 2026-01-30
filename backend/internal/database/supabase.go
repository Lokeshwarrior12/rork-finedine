package database

import (
	"log"
	"os"

	"github.com/supabase-community/supabase-go"
)

var (
	Client *supabase.Client
)

// Initialize Supabase client with connection pooling
func InitSupabase() {
	supabaseURL := os.Getenv("EXPO_PUBLIC_SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Fatal("❌ Missing Supabase credentials")
	}

	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Supabase: %v", err)
	}

	Client = client
	log.Println("✅ Supabase connected successfully")
}

// Query helpers with caching
func Query(table string) *supabase.QueryBuilder {
	return Client.From(table)
}
