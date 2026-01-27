// server/internal/repositories/restaurant.go
package repositories

import (
	"context"
	"os"

	supabase "github.com/supabase-community/supabase-go"
)

var supabaseClient *supabase.Client

func init() {
	supabaseClient = supabase.NewClient(
		os.Getenv("SUPABASE_URL"),
		os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		nil,
	)
}

// GetRestaurants fetches restaurants with optional filters
func GetRestaurants(ctx context.Context, filters map[string]interface{}) ([]map[string]interface{}, error) {
	query := supabaseClient.From("restaurants").Select("*", "id,name,description,cuisine_type,address,city,phone,email,rating,review_count,logo,images,opening_hours", false)

	// Apply filters if provided
	if city, ok := filters["city"]; ok {
		query = query.Eq("city", city.(string))
	}
	if cuisine, ok := filters["cuisine"]; ok {
		query = query.Eq("cuisine_type", cuisine.(string))
	}

	var result []map[string]interface{}
	_, err := query.ExecuteTo(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}
