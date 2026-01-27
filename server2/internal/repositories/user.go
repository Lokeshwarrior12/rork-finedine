// server/internal/repositories/user.go
package repositories

import (
	"context"
	"os"

	supabase "github.com/supabase-community/supabase-go"
)

var supabaseClient *supabase.Client // already initialized in restaurant.go, but we can reuse

// GetProfile fetches user profile by ID
func GetProfile(ctx context.Context, userID string) (map[string]interface{}, error) {
	var result []map[string]interface{}
	_, err := supabaseClient.From("users").
		Select("id, name, email, phone, address, role, points, restaurant_id, photo", "id,name,email,phone,address,role,points,restaurant_id,photo", false).
		Eq("id", userID).
		ExecuteTo(&result)

	if err != nil {
		return nil, err
	}

	if len(result) == 0 {
		return nil, nil // Not found
	}

	return result[0], nil
}
