package repositories

import (
	"context"
	"encoding/json"
	"fmt"
)

type Profile struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Avatar    string `json:"avatar"`
	Role      string `json:"role"`
	Points    int    `json:"points"`
	Address   string `json:"address"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func GetProfile(ctx context.Context, userID string) (*Profile, error) {
	endpoint := fmt.Sprintf("users?id=eq.%s&select=*", userID)

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var profiles []Profile
	if err := json.Unmarshal(data, &profiles); err != nil {
		return nil, err
	}

	if len(profiles) == 0 {
		return nil, nil
	}

	return &profiles[0], nil
}

func UpdateProfile(ctx context.Context, userID string, updates map[string]interface{}) (*Profile, error) {
	endpoint := fmt.Sprintf("users?id=eq.%s", userID)

	data, err := supabaseRequest("PATCH", endpoint, updates)
	if err != nil {
		return nil, err
	}

	var updated []Profile
	if err := json.Unmarshal(data, &updated); err != nil {
		return nil, err
	}

	if len(updated) == 0 {
		return nil, fmt.Errorf("profile not found")
	}

	return &updated[0], nil
}
