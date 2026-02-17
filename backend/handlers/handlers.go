// backend/internal/handlers/handlers.go
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/cache"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/config"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/middleware"
)

type Handler struct {
	db     *database.Client
	cache  *cache.RedisClient
	config *config.Config
}

func New(db *database.Client, cache *cache.RedisClient, cfg *config.Config) *Handler {
	return &Handler{
		db:     db,
		cache:  cache,
		config: cfg,
	}
}

// HealthCheck - GET /health
func (h *Handler) HealthCheck(c *gin.Context) {
	dbErr := h.db.Health()
	cacheErr := h.cache.Health()

	status := "healthy"
	code := http.StatusOK

	if dbErr != nil || cacheErr != nil {
		status = "unhealthy"
		code = http.StatusServiceUnavailable
	}

	c.JSON(code, gin.H{
		"status":    status,
		"timestamp": time.Now().Unix(),
		"database":  dbErr == nil,
		"cache":     cacheErr == nil,
	})
}

// GetRestaurants - GET /api/v1/restaurants
func (h *Handler) GetRestaurants(c *gin.Context) {
	cacheKey := "restaurants:all"
	
	// Try cache first
	var restaurants []map[string]interface{}
	err := h.cache.Get(cacheKey, &restaurants)
	
	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":   restaurants,
			"cached": true,
		})
		return
	}

	// Query from database
	query := `
		SELECT 
			r.id, r.name, r.address, r.phone, r.email, r.cuisine_types,
			r.price_range, r.rating, r.total_reviews, r.images,
			r.opening_hours, r.is_active, r.is_approved
		FROM restaurants r
		WHERE r.is_active = true AND r.is_approved = true
		ORDER BY r.rating DESC, r.total_reviews DESC
		LIMIT 100
	`

	rows, err := h.db.DB.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch restaurants"})
		return
	}
	defer rows.Close()

	restaurants = []map[string]interface{}{}
	for rows.Next() {
		var r struct {
			ID           string
			Name         string
			Address      string
			Phone        string
			Email        string
			CuisineTypes []string
			PriceRange   int
			Rating       float64
			TotalReviews int
			Images       []string
			OpeningHours map[string]interface{}
			IsActive     bool
			IsApproved   bool
		}

		if err := rows.Scan(
			&r.ID, &r.Name, &r.Address, &r.Phone, &r.Email, &r.CuisineTypes,
			&r.PriceRange, &r.Rating, &r.TotalReviews, &r.Images,
			&r.OpeningHours, &r.IsActive, &r.IsApproved,
		); err != nil {
			continue
		}

		restaurants = append(restaurants, map[string]interface{}{
			"id":            r.ID,
			"name":          r.Name,
			"address":       r.Address,
			"phone":         r.Phone,
			"email":         r.Email,
			"cuisineTypes":  r.CuisineTypes,
			"priceRange":    r.PriceRange,
			"rating":        r.Rating,
			"totalReviews":  r.TotalReviews,
			"images":        r.Images,
			"openingHours":  r.OpeningHours,
		})
	}

	// Cache for 5 minutes
	h.cache.Set(cacheKey, restaurants, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"data":   restaurants,
		"cached": false,
	})
}

// GetRestaurant - GET /api/v1/restaurants/:id
func (h *Handler) GetRestaurant(c *gin.Context) {
	id := c.Param("id")
	cacheKey := "restaurant:" + id

	// Try cache
	var restaurant map[string]interface{}
	err := h.cache.Get(cacheKey, &restaurant)
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"data": restaurant, "cached": true})
		return
	}

	// Query database
	query := `
		SELECT 
			id, name, address, phone, email, cuisine_types, description,
			price_range, rating, total_reviews, images, opening_hours,
			latitude, longitude, is_active
		FROM restaurants
		WHERE id = $1 AND is_active = true AND is_approved = true
	`

	var r struct {
		ID           string
		Name         string
		Address      string
		Phone        string
		Email        string
		CuisineTypes []string
		Description  string
		PriceRange   int
		Rating       float64
		TotalReviews int
		Images       []string
		OpeningHours map[string]interface{}
		Latitude     float64
		Longitude    float64
		IsActive     bool
	}

	err = h.db.DB.QueryRow(query, id).Scan(
		&r.ID, &r.Name, &r.Address, &r.Phone, &r.Email, &r.CuisineTypes,
		&r.Description, &r.PriceRange, &r.Rating, &r.TotalReviews, &r.Images,
		&r.OpeningHours, &r.Latitude, &r.Longitude, &r.IsActive,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restaurant not found"})
		return
	}

	restaurant = map[string]interface{}{
		"id":           r.ID,
		"name":         r.Name,
		"address":      r.Address,
		"phone":        r.Phone,
		"email":        r.Email,
		"cuisineTypes": r.CuisineTypes,
		"description":  r.Description,
		"priceRange":   r.PriceRange,
		"rating":       r.Rating,
		"totalReviews": r.TotalReviews,
		"images":       r.Images,
		"openingHours": r.OpeningHours,
		"location": map[string]float64{
			"latitude":  r.Latitude,
			"longitude": r.Longitude,
		},
	}

	// Cache for 10 minutes
	h.cache.Set(cacheKey, restaurant, 10*time.Minute)

	c.JSON(http.StatusOK, gin.H{"data": restaurant, "cached": false})
}

// CreateOrder - POST /api/v1/orders
func (h *Handler) CreateOrder(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		RestaurantID string                   `json:"restaurantId" binding:"required"`
		Items        []map[string]interface{} `json:"items" binding:"required"`
		DeliveryAddress string                `json:"deliveryAddress" binding:"required"`
		Notes        string                   `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Calculate totals (simplified - in production, verify prices from DB)
	subtotal := 0.0
	for _, item := range req.Items {
		if price, ok := item["price"].(float64); ok {
			if qty, ok := item["quantity"].(float64); ok {
				subtotal += price * qty
			}
		}
	}

	tax := subtotal * 0.1 // 10% tax
	deliveryFee := 5.0
	total := subtotal + tax + deliveryFee

	// Insert order
	query := `
		INSERT INTO orders (
			user_id, restaurant_id, items, delivery_address,
			notes, subtotal, tax, delivery_fee, total, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
		RETURNING id, created_at
	`

	var orderID string
	var createdAt time.Time

	err = h.db.DB.QueryRow(
		query, userID, req.RestaurantID, req.Items, req.DeliveryAddress,
		req.Notes, subtotal, tax, deliveryFee, total,
	).Scan(&orderID, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": map[string]interface{}{
			"id":              orderID,
			"userId":          userID,
			"restaurantId":    req.RestaurantID,
			"items":           req.Items,
			"deliveryAddress": req.DeliveryAddress,
			"notes":           req.Notes,
			"subtotal":        subtotal,
			"tax":             tax,
			"deliveryFee":     deliveryFee,
			"total":           total,
			"status":          "pending",
			"createdAt":       createdAt,
		},
	})
}

// GetOrder - GET /api/v1/orders/:id
func (h *Handler) GetOrder(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	orderID := c.Param("id")

	query := `
		SELECT 
			o.id, o.user_id, o.restaurant_id, o.items, o.delivery_address,
			o.notes, o.subtotal, o.tax, o.delivery_fee, o.total, o.status,
			o.created_at, o.updated_at,
			r.name as restaurant_name
		FROM orders o
		JOIN restaurants r ON r.id = o.restaurant_id
		WHERE o.id = $1 AND o.user_id = $2
	`

	var order struct {
		ID              string
		UserID          string
		RestaurantID    string
		Items           []map[string]interface{}
		DeliveryAddress string
		Notes           string
		Subtotal        float64
		Tax             float64
		DeliveryFee     float64
		Total           float64
		Status          string
		CreatedAt       time.Time
		UpdatedAt       time.Time
		RestaurantName  string
	}

	err = h.db.DB.QueryRow(query, orderID, userID).Scan(
		&order.ID, &order.UserID, &order.RestaurantID, &order.Items,
		&order.DeliveryAddress, &order.Notes, &order.Subtotal, &order.Tax,
		&order.DeliveryFee, &order.Total, &order.Status, &order.CreatedAt,
		&order.UpdatedAt, &order.RestaurantName,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": order})
}

// Placeholder handlers (implement similarly)
func (h *Handler) GetRestaurantMenu(c *gin.Context)      { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetUserProfile(c *gin.Context)         { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateUserProfile(c *gin.Context)      { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetUserOrders(c *gin.Context)          { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) CreateBooking(c *gin.Context)          { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetBooking(c *gin.Context)             { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetUserBookings(c *gin.Context)        { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) AddFavorite(c *gin.Context)            { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetFavorites(c *gin.Context)           { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) RemoveFavorite(c *gin.Context)         { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetNotifications(c *gin.Context)       { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) MarkNotificationRead(c *gin.Context)   { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) CreateRestaurant(c *gin.Context)       { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateRestaurant(c *gin.Context)       { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) DeleteRestaurant(c *gin.Context)       { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) AddMenuItem(c *gin.Context)            { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateMenuItem(c *gin.Context)         { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) DeleteMenuItem(c *gin.Context)         { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetRestaurantOrders(c *gin.Context)    { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateOrderStatus(c *gin.Context)      { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetInventory(c *gin.Context)           { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateInventory(c *gin.Context)        { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetRestaurantAnalytics(c *gin.Context) { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetAllUsers(c *gin.Context)            { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) UpdateUserRole(c *gin.Context)         { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) GetPendingRestaurants(c *gin.Context)  { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) ApproveRestaurant(c *gin.Context)      { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
func (h *Handler) HandleStripeWebhook(c *gin.Context)    { c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"}) }
