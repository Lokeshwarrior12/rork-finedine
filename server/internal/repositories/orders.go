package repositories

import (
	"context"
	"encoding/json"
	"fmt"
)

type OrderItem struct {
	MenuItemID string  `json:"menu_item_id"`
	Name       string  `json:"name"`
	Quantity   int     `json:"quantity"`
	Price      float64 `json:"price"`
}

type Order struct {
	ID           string      `json:"id"`
	UserID       string      `json:"user_id"`
	RestaurantID string      `json:"restaurant_id"`
	Items        []OrderItem `json:"items"`
	Subtotal     float64     `json:"subtotal"`
	Tax          float64     `json:"tax"`
	Total        float64     `json:"total"`
	Status       string      `json:"status"`
	Notes        string      `json:"notes"`
	CreatedAt    string      `json:"created_at"`
	UpdatedAt    string      `json:"updated_at"`
}

func GetOrders(ctx context.Context, userID string, status string) ([]Order, error) {
	endpoint := fmt.Sprintf("orders?user_id=eq.%s&select=*&order=created_at.desc", userID)

	if status != "" {
		endpoint += "&status=eq." + status
	}

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var orders []Order
	if err := json.Unmarshal(data, &orders); err != nil {
		return nil, err
	}

	return orders, nil
}

func GetRestaurantOrders(ctx context.Context, restaurantID string, status string) ([]Order, error) {
	endpoint := fmt.Sprintf("orders?restaurant_id=eq.%s&select=*&order=created_at.desc", restaurantID)

	if status != "" {
		endpoint += "&status=eq." + status
	}

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var orders []Order
	if err := json.Unmarshal(data, &orders); err != nil {
		return nil, err
	}

	return orders, nil
}

func GetOrderByID(ctx context.Context, orderID string) (*Order, error) {
	endpoint := fmt.Sprintf("orders?id=eq.%s&select=*", orderID)

	data, err := supabaseRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var orders []Order
	if err := json.Unmarshal(data, &orders); err != nil {
		return nil, err
	}

	if len(orders) == 0 {
		return nil, nil
	}

	return &orders[0], nil
}

func CreateOrder(ctx context.Context, order *Order) (*Order, error) {
	data, err := supabaseRequest("POST", "orders", order)
	if err != nil {
		return nil, err
	}

	var created []Order
	if err := json.Unmarshal(data, &created); err != nil {
		return nil, err
	}

	if len(created) == 0 {
		return nil, fmt.Errorf("failed to create order")
	}

	return &created[0], nil
}

func UpdateOrderStatus(ctx context.Context, orderID string, status string) (*Order, error) {
	endpoint := fmt.Sprintf("orders?id=eq.%s", orderID)

	data, err := supabaseRequest("PATCH", endpoint, map[string]string{"status": status})
	if err != nil {
		return nil, err
	}

	var updated []Order
	if err := json.Unmarshal(data, &updated); err != nil {
		return nil, err
	}

	if len(updated) == 0 {
		return nil, fmt.Errorf("order not found")
	}

	return &updated[0], nil
}
