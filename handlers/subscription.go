package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/Lokeshwarrior12/rork-finedine/backend/internal/database"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

// Initialize Stripe
func init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

// Create subscription checkout session
func CreateSubscriptionCheckout(c *gin.Context) {
	userID := c.GetString("userId")
	email := c.GetString("email")

	var input struct {
		RestaurantID string `json:"restaurant_id" binding:"required"`
		PriceID      string `json:"price_id"` // Optional: for different subscription tiers
	}

	if err := c.BindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Default annual subscription price ($500/year)
	priceID := input.PriceID
	if priceID == "" {
		priceID = "price_annual_subscription" // You'll create this in Stripe Dashboard
	}

	// Create Stripe Checkout Session
	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(os.Getenv("FRONTEND_URL") + "/subscription/success?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(os.Getenv("FRONTEND_URL") + "/subscription/cancel"),
		CustomerEmail: stripe.String(email),
		Metadata: map[string]string{
			"user_id":       userID,
			"restaurant_id": input.RestaurantID,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": sess.ID,
		"url":        sess.URL,
	})
}

// Get subscription status
func GetSubscriptionStatus(c *gin.Context) {
	userID := c.GetString("userId")

	// Get all restaurants owned by user
	restaurants, _, err := database.Query("restaurants").
		Select("id, name, subscription_status, subscription_expires_at").
		Eq("owner_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscription status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": restaurants})
}

// Stripe webhook handler (for subscription updates)
func StripeWebhook(c *gin.Context) {
	const MaxBodyBytes = int64(65536)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxBodyBytes)
	
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Error reading request body"})
		return
	}

	event := stripe.Event{}

	if err := json.Unmarshal(payload, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Webhook error"})
		return
	}

	// Handle different event types
	switch event.Type {
	case "checkout.session.completed":
		// Handle successful subscription
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing webhook"})
			return
		}

		restaurantID := session.Metadata["restaurant_id"]
		
		// Update restaurant subscription
		expiresAt := time.Now().AddDate(1, 0, 0) // 1 year from now

		database.Query("restaurants").
			Update(map[string]interface{}{
				"subscription_status":    "active",
				"subscription_expires_at": expiresAt.Format(time.RFC3339),
			}, "", "").
			Eq("id", restaurantID).
			Execute()

	case "customer.subscription.deleted":
		// Handle subscription cancellation
		var subscription stripe.Subscription
		json.Unmarshal(event.Data.Raw, &subscription)

		// Find restaurant and deactivate
		// You'd need to store subscription ID with restaurant

	case "invoice.payment_failed":
		// Handle failed payment
		// Send notification to restaurant owner
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}
