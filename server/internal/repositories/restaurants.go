package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
)

type Restaurant struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Cuisine     string   `json:"cuisine"`
	Rating      float64  `json:"rating"`
	PriceRange  string   `json:"price_range"`
	Images      []string `json:"images"`
	OwnerID     string   `json:"owner_id"`
	IsActive    bool     `json:"is_active"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

func GetRestaurants(ctx context.Context, filters map[string]interface{}) ([]Restaurant, error) {
	endpoint := "restaurants?select=*&is_active=eq.true"

	if city, ok := filters["city"].(string); ok && city != "" {
		endpoint += "&city=ilike.*" + url.QueryEscape(city) + "*"
	}

	if cuisine, ok := filters["cuisine"].(string); ok && cuisine != "" {
		endpoint += "&cuisine=ilike.*" + url.QueryEscape(cuisine) + "*"
	}

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var restaurants []Restaurant
	if err := json.Unmarshal(data, &restaurants); err != nil {
		return nil, err
	}

	return restaurants, nil
}

func GetRestaurantByID(ctx context.Context, id string) (*Restaurant, error) {
	endpoint := fmt.Sprintf("restaurants?id=eq.%s&select=*", id)

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var restaurants []Restaurant
	if err := json.Unmarshal(data, &restaurants); err != nil {
		return nil, err
	}

	if len(restaurants) == 0 {
		return nil, nil
	}

	return &restaurants[0], nil
}

func CreateRestaurant(ctx context.Context, restaurant *Restaurant) (*Restaurant, error) {
	data, err := supabaseRequest("POST", "restaurants", restaurant)
	if err != nil {
		return nil, err
	}

	var created []Restaurant
	if err := json.Unmarshal(data, &created); err != nil {
		return nil, err
	}

	if len(created) == 0 {
		return nil, fmt.Errorf("failed to create restaurant")
	}

	return &created[0], nil
}

func UpdateRestaurant(ctx context.Context, id string, updates map[string]interface{}) (*Restaurant, error) {
	endpoint := fmt.Sprintf("restaurants?id=eq.%s", id)

	data, err := supabaseRequest("PATCH", endpoint, updates)
	if err != nil {
		return nil, err
	}

	var updated []Restaurant
	if err := json.Unmarshal(data, &updated); err != nil {
		return nil, err
	}

	if len(updated) == 0 {
		return nil, fmt.Errorf("restaurant not found")
	}

	return &updated[0], nil
}
