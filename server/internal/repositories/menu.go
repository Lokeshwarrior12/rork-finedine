package repositories

import (
	"context"
	"encoding/json"
	"fmt"
)

type MenuItem struct {
	ID           string   `json:"id"`
	RestaurantID string   `json:"restaurant_id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Price        float64  `json:"price"`
	Category     string   `json:"category"`
	Image        string   `json:"image"`
	IsVegetarian bool     `json:"is_vegetarian"`
	IsVegan      bool     `json:"is_vegan"`
	IsGlutenFree bool     `json:"is_gluten_free"`
	IsAvailable  bool     `json:"is_available"`
	Allergens    []string `json:"allergens"`
	CreatedAt    string   `json:"created_at"`
	UpdatedAt    string   `json:"updated_at"`
}

func GetMenuItems(ctx context.Context, restaurantID string) ([]MenuItem, error) {
	endpoint := fmt.Sprintf("menu_items?restaurant_id=eq.%s&select=*&is_available=eq.true&order=category,name", restaurantID)

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var items []MenuItem
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, err
	}

	return items, nil
}

func GetMenuItemByID(ctx context.Context, itemID string) (*MenuItem, error) {
	endpoint := fmt.Sprintf("menu_items?id=eq.%s&select=*", itemID)

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var items []MenuItem
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return nil, nil
	}

	return &items[0], nil
}

func CreateMenuItem(ctx context.Context, item *MenuItem) (*MenuItem, error) {
	data, err := supabaseRequest("POST", "menu_items", item)
	if err != nil {
		return nil, err
	}

	var created []MenuItem
	if err := json.Unmarshal(data, &created); err != nil {
		return nil, err
	}

	if len(created) == 0 {
		return nil, fmt.Errorf("failed to create menu item")
	}

	return &created[0], nil
}

func UpdateMenuItem(ctx context.Context, itemID string, updates map[string]interface{}) (*MenuItem, error) {
	endpoint := fmt.Sprintf("menu_items?id=eq.%s", itemID)

	data, err := supabaseRequest("PATCH", endpoint, updates)
	if err != nil {
		return nil, err
	}

	var updated []MenuItem
	if err := json.Unmarshal(data, &updated); err != nil {
		return nil, err
	}

	if len(updated) == 0 {
		return nil, fmt.Errorf("menu item not found")
	}

	return &updated[0], nil
}

func DeleteMenuItem(ctx context.Context, itemID string) error {
	endpoint := fmt.Sprintf("menu_items?id=eq.%s", itemID)
	_, err := supabaseRequest("DELETE", endpoint, nil)
	return err
}
