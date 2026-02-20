package handlers

// This file contains handlers that do not belong to a more specific file:
// - Employees, Shifts, Offers, Coupons, Transactions, Auth stubs
//
// Handler architecture: package-level functions (NOT struct methods).
// Do NOT reintroduce the struct-based Handler pattern from
// backend/internal/handlers/handlers.go — that file is DELETED / obsolete.
//
// Function ownership map (one definition, one file):
//   health.go         → HealthCheck
//   restaurants.go    → GetRestaurants, GetRestaurantByID, GetNearbyRestaurants,
//                       GetRestaurantMenu, SearchRestaurants, CreateRestaurant,
//                       UpdateRestaurant, AddMenuItem, UpdateMenuItem, DeleteMenuItem
//   orders.go         → CreateOrder, GetUserOrders, GetOrderByID, CancelOrder,
//                       GetRestaurantOrders, UpdateOrderStatus
//   bookings.go       → CreateBooking, GetUserBookings, GetBookingByID,
//                       CancelBooking, GetRestaurantBookings, UpdateBookingStatus
//   profile.go        → GetProfile, UpdateProfile
//   favorites.go      → AddFavorite, RemoveFavorite, GetFavorites
//   notifications.go  → GetNotifications, MarkNotificationRead,
//                       MarkAllNotificationsRead
//   deals.go          → GetActiveDeals, GetFeaturedDeals, CreateDeal,
//                       UpdateDeal, DeleteDeal
//   inventory.go      → GetInventory, AddInventoryItem, UpdateInventoryItem,
//                       DeleteInventoryItem
//   analytics.go      → GetRestaurantAnalytics
//   admin.go          → GetAllUsers, GetPendingRestaurants, VerifyRestaurant
//   subscription.go   → CreateSubscriptionCheckout, GetSubscriptionStatus,
//                       StripeWebhook
//   handlers.go (this file) → everything else listed below

import (
	"net/http"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────────────────────────────────────────
// Employee handlers
// ─────────────────────────────────────────────────────────────────────────────

// GetRestaurantEmployees - owner lists all employees for a restaurant
func GetRestaurantEmployees(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("employees").
		Select("id, name, role, phone, email, hourly_rate, is_active, created_at").
		Eq("restaurant_id", restaurantID).
		Order("name", nil).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateEmployee - owner adds an employee to a restaurant
func CreateEmployee(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input struct {
		Name       string  `json:"name" binding:"required"`
		Role       string  `json:"role" binding:"required"`
		Phone      string  `json:"phone"`
		Email      string  `json:"email"`
		HourlyRate float64 `json:"hourly_rate"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("employees").
		Insert(map[string]interface{}{
			"restaurant_id": restaurantID,
			"name":          input.Name,
			"role":          input.Role,
			"phone":         input.Phone,
			"email":         input.Email,
			"hourly_rate":   input.HourlyRate,
			"is_active":     true,
		}, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Employee created successfully",
	})
}

// UpdateEmployee - owner updates an employee record
func UpdateEmployee(c *gin.Context) {
	employeeID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	delete(updates, "id")
	delete(updates, "restaurant_id")

	result, _, err := database.Query("employees").
		Update(updates, "", "*").
		Eq("id", employeeID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Employee updated successfully",
	})
}

// DeleteEmployee - owner removes an employee
func DeleteEmployee(c *gin.Context) {
	employeeID := c.Param("id")

	_, _, err := database.Query("employees").
		Delete("", "").
		Eq("id", employeeID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Shift handlers
// ─────────────────────────────────────────────────────────────────────────────

// GetRestaurantShifts - owner lists all shifts for a restaurant
func GetRestaurantShifts(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("shifts").
		Select("*, employee:employees(id, name, role)").
		Eq("restaurant_id", restaurantID).
		Order("shift_date", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shifts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateShift - owner creates a shift entry
func CreateShift(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input struct {
		EmployeeID string `json:"employee_id" binding:"required"`
		ShiftDate  string `json:"shift_date" binding:"required"`
		StartTime  string `json:"start_time" binding:"required"`
		EndTime    string `json:"end_time" binding:"required"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("shifts").
		Insert(map[string]interface{}{
			"restaurant_id": restaurantID,
			"employee_id":   input.EmployeeID,
			"shift_date":    input.ShiftDate,
			"start_time":    input.StartTime,
			"end_time":      input.EndTime,
			"notes":         input.Notes,
		}, false, "", "*, employee:employees(id, name, role)", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Shift created successfully",
	})
}

// DeleteShift - owner removes a shift
func DeleteShift(c *gin.Context) {
	shiftID := c.Param("id")

	_, _, err := database.Query("shifts").
		Delete("", "").
		Eq("id", shiftID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete shift"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift deleted successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer handlers
// ─────────────────────────────────────────────────────────────────────────────

// GetRestaurantOffers - owner lists all offers for a restaurant
func GetRestaurantOffers(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("offers").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateOffer - owner creates an offer and notifies favorited users
func CreateOffer(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	input["restaurant_id"] = restaurantID

	result, _, err := database.Query("offers").
		Insert(input, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Offer created successfully",
	})
}

// UpdateOffer - owner updates an existing offer
func UpdateOffer(c *gin.Context) {
	offerID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	delete(updates, "id")
	delete(updates, "restaurant_id")

	result, _, err := database.Query("offers").
		Update(updates, "", "*").
		Eq("id", offerID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update offer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// DeleteOffer - owner deletes an offer
func DeleteOffer(c *gin.Context) {
	offerID := c.Param("id")

	_, _, err := database.Query("offers").
		Delete("", "").
		Eq("id", offerID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete offer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Offer deleted successfully"})
}

// ─────────────────────────────────────────────────────────────────────────────
// Coupon & Transaction handlers
// ─────────────────────────────────────────────────────────────────────────────

// ValidateCoupon - owner or system validates a coupon code at checkout
func ValidateCoupon(c *gin.Context) {
	var input struct {
		Code         string  `json:"code" binding:"required"`
		RestaurantID string  `json:"restaurant_id" binding:"required"`
		OrderTotal   float64 `json:"order_total" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	result, _, err := database.Query("coupons").
		Select("*").
		Eq("code", input.Code).
		Eq("restaurant_id", input.RestaurantID).
		Eq("is_active", "true").
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coupon not found or expired"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    result,
		"message": "Coupon is valid",
	})
}

// CreateTransaction - record a financial transaction for a restaurant
func CreateTransaction(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	input["restaurant_id"] = restaurantID

	result, _, err := database.Query("transactions").
		Insert(input, false, "", "*", "").
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    result,
		"message": "Transaction recorded",
	})
}

// GetRestaurantTransactions - owner views all financial transactions
func GetRestaurantTransactions(c *gin.Context) {
	restaurantID := c.Param("id")
	userID := c.GetString("userId")

	// Verify ownership
	_, _, err := database.Query("restaurants").
		Select("id").
		Eq("id", restaurantID).
		Eq("owner_id", userID).
		Single().
		Execute()

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	result, _, err := database.Query("transactions").
		Select("*").
		Eq("restaurant_id", restaurantID).
		Order("created_at", &database.OrderOpts{Ascending: false}).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
