// backend/handlers/new_handlers.go
// ADD THESE FUNCTIONS TO YOUR HANDLERS PACKAGE

package handlers

import (
	"net/http"
	"time"

	"finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
)

/* ═══════════════════════════════════════════════════════════════
   INVENTORY HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// GetInventory - Get restaurant inventory
func GetInventory(c *gin.Context) {
	restaurantID := c.Param("id")

	query := `
		SELECT id, restaurant_id, name, category, quantity, unit, min_stock, 
		       cost_per_unit, supplier, sku, purchase_date, expiry_date, 
		       notes, image, created_at, updated_at
		FROM inventory
		WHERE restaurant_id = $1
		ORDER BY name ASC
	`

	rows, err := database.DB.Query(query, restaurantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	defer rows.Close()

	inventory := []gin.H{}
	for rows.Next() {
		var item gin.H
		var id, restaurantId, name, category, unit, supplier, sku, notes, image string
		var quantity, minStock, costPerUnit float64
		var purchaseDate, expiryDate, createdAt, updatedAt *time.Time

		err := rows.Scan(&id, &restaurantId, &name, &category, &quantity, &unit, &minStock,
			&costPerUnit, &supplier, &sku, &purchaseDate, &expiryDate, &notes, &image,
			&createdAt, &updatedAt)
		
		if err != nil {
			continue
		}

		item = gin.H{
			"id":            id,
			"restaurantId":  restaurantId,
			"name":          name,
			"category":      category,
			"quantity":      quantity,
			"unit":          unit,
			"minStock":      minStock,
			"costPerUnit":   costPerUnit,
			"supplier":      supplier,
			"sku":           sku,
			"purchaseDate":  purchaseDate,
			"expiryDate":    expiryDate,
			"notes":         notes,
			"image":         image,
			"createdAt":     createdAt,
			"updatedAt":     updatedAt,
		}
		inventory = append(inventory, item)
	}

	c.JSON(http.StatusOK, gin.H{"data": inventory})
}

// AddInventoryItem - Add new inventory item
func AddInventoryItem(c *gin.Context) {
	restaurantID := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		INSERT INTO inventory (restaurant_id, name, category, quantity, unit, min_stock, cost_per_unit, supplier, sku, purchase_date, expiry_date, notes, image)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err := database.DB.QueryRow(query, restaurantID, input["name"], input["category"], 
		input["quantity"], input["unit"], input["minStock"], input["costPerUnit"],
		input["supplier"], input["sku"], input["purchaseDate"], input["expiryDate"],
		input["notes"], input["image"]).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create inventory item"})
		return
	}

	input["id"] = id
	input["createdAt"] = createdAt
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

// UpdateInventoryItem - Update inventory item
func UpdateInventoryItem(c *gin.Context) {
	id := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		UPDATE inventory 
		SET name = $1, category = $2, quantity = $3, unit = $4, min_stock = $5,
		    cost_per_unit = $6, supplier = $7, sku = $8, purchase_date = $9,
		    expiry_date = $10, notes = $11, image = $12, updated_at = NOW()
		WHERE id = $13
		RETURNING updated_at
	`

	var updatedAt time.Time
	err := database.DB.QueryRow(query, input["name"], input["category"], input["quantity"],
		input["unit"], input["minStock"], input["costPerUnit"], input["supplier"],
		input["sku"], input["purchaseDate"], input["expiryDate"], input["notes"],
		input["image"], id).Scan(&updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory item"})
		return
	}

	input["updatedAt"] = updatedAt
	c.JSON(http.StatusOK, gin.H{"data": input})
}

// DeleteInventoryItem - Delete inventory item
func DeleteInventoryItem(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM inventory WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete inventory item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Inventory item deleted", "id": id})
}

/* ═══════════════════════════════════════════════════════════════
   EMPLOYEE HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// GetRestaurantEmployees - Get all employees
func GetRestaurantEmployees(c *gin.Context) {
	restaurantID := c.Param("id")

	query := `
		SELECT id, restaurant_id, name, role, email, phone, hourly_rate, availability, created_at, updated_at
		FROM employees
		WHERE restaurant_id = $1
		ORDER BY name ASC
	`

	rows, err := database.DB.Query(query, restaurantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}
	defer rows.Close()

	employees := []gin.H{}
	for rows.Next() {
		var id, restaurantId, name, role, email, phone string
		var hourlyRate float64
		var availability interface{}
		var createdAt, updatedAt time.Time

		err := rows.Scan(&id, &restaurantId, &name, &role, &email, &phone, &hourlyRate, &availability, &createdAt, &updatedAt)
		if err != nil {
			continue
		}

		employees = append(employees, gin.H{
			"id":           id,
			"restaurantId": restaurantId,
			"name":         name,
			"role":         role,
			"email":        email,
			"phone":        phone,
			"hourlyRate":   hourlyRate,
			"availability": availability,
			"createdAt":    createdAt,
			"updatedAt":    updatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": employees})
}

// CreateEmployee - Create new employee
func CreateEmployee(c *gin.Context) {
	restaurantID := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		INSERT INTO employees (restaurant_id, name, role, email, phone, hourly_rate, availability)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err := database.DB.QueryRow(query, restaurantID, input["name"], input["role"],
		input["email"], input["phone"], input["hourlyRate"], input["availability"]).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee"})
		return
	}

	input["id"] = id
	input["createdAt"] = createdAt
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

// UpdateEmployee - Update employee
func UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		UPDATE employees 
		SET name = $1, role = $2, email = $3, phone = $4, hourly_rate = $5, availability = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING updated_at
	`

	var updatedAt time.Time
	err := database.DB.QueryRow(query, input["name"], input["role"], input["email"],
		input["phone"], input["hourlyRate"], input["availability"], id).Scan(&updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employee"})
		return
	}

	input["updatedAt"] = updatedAt
	c.JSON(http.StatusOK, gin.H{"data": input})
}

// DeleteEmployee - Delete employee
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM employees WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted", "id": id})
}

/* ═══════════════════════════════════════════════════════════════
   SHIFT HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// GetRestaurantShifts - Get shifts for date range
func GetRestaurantShifts(c *gin.Context) {
	restaurantID := c.Param("id")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	query := `
		SELECT s.id, s.employee_id, e.name as employee_name, e.role, s.date, s.start_time, s.end_time, s.status, s.notes, s.created_at
		FROM shifts s
		JOIN employees e ON s.employee_id = e.id
		WHERE s.restaurant_id = $1 AND s.date >= $2 AND s.date <= $3
		ORDER BY s.date ASC, s.start_time ASC
	`

	rows, err := database.DB.Query(query, restaurantID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shifts"})
		return
	}
	defer rows.Close()

	shifts := []gin.H{}
	for rows.Next() {
		var id, employeeId, employeeName, role, date, startTime, endTime, status, notes string
		var createdAt time.Time

		err := rows.Scan(&id, &employeeId, &employeeName, &role, &date, &startTime, &endTime, &status, &notes, &createdAt)
		if err != nil {
			continue
		}

		shifts = append(shifts, gin.H{
			"id":           id,
			"employeeId":   employeeId,
			"employeeName": employeeName,
			"role":         role,
			"date":         date,
			"startTime":    startTime,
			"endTime":      endTime,
			"status":       status,
			"notes":        notes,
			"createdAt":    createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": shifts})
}

// CreateShift - Create new shift
func CreateShift(c *gin.Context) {
	restaurantID := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		INSERT INTO shifts (restaurant_id, employee_id, date, start_time, end_time, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err := database.DB.QueryRow(query, restaurantID, input["employeeId"], input["date"],
		input["startTime"], input["endTime"], input["notes"]).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift"})
		return
	}

	input["id"] = id
	input["createdAt"] = createdAt
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

// DeleteShift - Delete shift
func DeleteShift(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM shifts WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete shift"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift deleted", "id": id})
}

/* ═══════════════════════════════════════════════════════════════
   OFFER HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// GetRestaurantOffers - Get all offers
func GetRestaurantOffers(c *gin.Context) {
	restaurantID := c.Param("id")

	query := `
		SELECT id, restaurant_id, title, description, discount_percent, offer_type, max_coupons, claimed_coupons, min_order, valid_till, is_active, created_at
		FROM offers
		WHERE restaurant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query, restaurantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offers"})
		return
	}
	defer rows.Close()

	offers := []gin.H{}
	for rows.Next() {
		var id, restaurantId, title, description, offerType string
		var discountPercent, maxCoupons, claimedCoupons int
		var minOrder float64
		var validTill time.Time
		var isActive bool
		var createdAt time.Time

		err := rows.Scan(&id, &restaurantId, &title, &description, &discountPercent, &offerType,
			&maxCoupons, &claimedCoupons, &minOrder, &validTill, &isActive, &createdAt)
		if err != nil {
			continue
		}

		offers = append(offers, gin.H{
			"id":              id,
			"restaurantId":    restaurantId,
			"title":           title,
			"description":     description,
			"discountPercent": discountPercent,
			"offerType":       offerType,
			"maxCoupons":      maxCoupons,
			"claimedCoupons":  claimedCoupons,
			"minOrder":        minOrder,
			"validTill":       validTill,
			"isActive":        isActive,
			"createdAt":       createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": offers})
}

// CreateOffer - Create new offer
func CreateOffer(c *gin.Context) {
	restaurantID := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		INSERT INTO offers (restaurant_id, title, description, discount_percent, offer_type, max_coupons, min_order, valid_till, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err := database.DB.QueryRow(query, restaurantID, input["title"], input["description"],
		input["discountPercent"], input["offerType"], input["maxCoupons"], input["minOrder"],
		input["validTill"], input["isActive"]).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer"})
		return
	}

	input["id"] = id
	input["createdAt"] = createdAt
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

// UpdateOffer - Update offer
func UpdateOffer(c *gin.Context) {
	id := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		UPDATE offers 
		SET title = $1, description = $2, discount_percent = $3, offer_type = $4, max_coupons = $5, min_order = $6, valid_till = $7, is_active = $8, updated_at = NOW()
		WHERE id = $9
		RETURNING updated_at
	`

	var updatedAt time.Time
	err := database.DB.QueryRow(query, input["title"], input["description"], input["discountPercent"],
		input["offerType"], input["maxCoupons"], input["minOrder"], input["validTill"],
		input["isActive"], id).Scan(&updatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update offer"})
		return
	}

	input["updatedAt"] = updatedAt
	c.JSON(http.StatusOK, gin.H{"data": input})
}

// DeleteOffer - Delete offer
func DeleteOffer(c *gin.Context) {
	id := c.Param("id")

	query := `DELETE FROM offers WHERE id = $1`
	_, err := database.DB.Exec(query, id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete offer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Offer deleted", "id": id})
}

/* ═══════════════════════════════════════════════════════════════
   TRANSACTION HANDLERS
   ═══════════════════════════════════════════════════════════════ */

// ValidateCoupon - Validate coupon code
func ValidateCoupon(c *gin.Context) {
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	code := input["code"].(string)

	query := `
		SELECT id, code, deal_title, discount_percent, status, min_order
		FROM coupons
		WHERE code = $1
	`

	var id, dealCode, dealTitle, status string
	var discountPercent int
	var minOrder float64

	err := database.DB.QueryRow(query, code).Scan(&id, &dealCode, &dealTitle, &discountPercent, &status, &minOrder)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid coupon code"})
		return
	}

	if status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Coupon is not active"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":              id,
			"code":            dealCode,
			"dealTitle":       dealTitle,
			"discountPercent": discountPercent,
			"status":          status,
			"minOrder":        minOrder,
		},
	})
}

// CreateTransaction - Create new transaction
func CreateTransaction(c *gin.Context) {
	restaurantID := c.Param("id")
	
	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `
		INSERT INTO transactions (restaurant_id, customer_name, coupon_id, coupon_code, original_amount, discount_amount, final_amount, payment_method)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`

	var id string
	var createdAt time.Time
	err := database.DB.QueryRow(query, restaurantID, input["customerName"], input["couponId"],
		input["couponCode"], input["originalAmount"], input["discountAmount"],
		input["finalAmount"], input["paymentMethod"]).Scan(&id, &createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	input["id"] = id
	input["createdAt"] = createdAt
	c.JSON(http.StatusCreated, gin.H{"data": input})
}

// GetRestaurantTransactions - Get all transactions
func GetRestaurantTransactions(c *gin.Context) {
	restaurantID := c.Param("id")

	query := `
		SELECT id, customer_name, coupon_code, original_amount, discount_amount, final_amount, payment_method, status, created_at
		FROM transactions
		WHERE restaurant_id = $1
		ORDER BY created_at DESC
		LIMIT 100
	`

	rows, err := database.DB.Query(query, restaurantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	defer rows.Close()

	transactions := []gin.H{}
	for rows.Next() {
		var id, customerName, couponCode, paymentMethod, status string
		var originalAmount, discountAmount, finalAmount float64
		var createdAt time.Time

		err := rows.Scan(&id, &customerName, &couponCode, &originalAmount, &discountAmount,
			&finalAmount, &paymentMethod, &status, &createdAt)
		if err != nil {
			continue
		}

		transactions = append(transactions, gin.H{
			"id":             id,
			"customerName":   customerName,
			"couponCode":     couponCode,
			"originalAmount": originalAmount,
			"discountAmount": discountAmount,
			"finalAmount":    finalAmount,
			"paymentMethod":  paymentMethod,
			"status":         status,
			"createdAt":      createdAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}
