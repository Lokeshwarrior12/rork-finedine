package database

import (
	"log"
	"net/http"
	"os"

	"github.com/supabase-community/postgrest-go"
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

	// Performance tuning for 1000+ users: Customize global HTTP client transport
	// This prevents port exhaustion and ensures connection re-use for Supabase REST requests
	if t, ok := http.DefaultTransport.(*http.Transport); ok {
		t.MaxIdleConns = 1000
		t.MaxIdleConnsPerHost = 100
		t.MaxConnsPerHost = 1000
	}

	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Supabase: %v", err)
	}

	Client = client
	log.Println("✅ Supabase connected successfully")
}

// Query helpers with caching
func Query(table string) *postgrest.QueryBuilder {
	return Client.From(table)
}
