package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"finedine/backend/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

func init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

// CreateSubscriptionCheckout - generate a Stripe Checkout session for subscription
func CreateSubscriptionCheckout(c *gin.Context) {
	userID := c.GetString("userId")
	email := c.GetString("email")

	var input struct {
		RestaurantID string `json:"restaurant_id" binding:"required"`
		PriceID      string `json:"price_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "restaurant_id is required"})
		return
	}

	priceID := input.PriceID
	if priceID == "" {
		priceID = os.Getenv("STRIPE_ANNUAL_PRICE_ID")
	}
	if priceID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Stripe price ID not configured"})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL:    stripe.String(frontendURL + "/subscription/success?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:     stripe.String(frontendURL + "/subscription/cancel"),
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

// GetSubscriptionStatus - return subscription state for all restaurants owned by user
func GetSubscriptionStatus(c *gin.Context) {
	userID := c.GetString("userId")

	result, _, err := database.Query("restaurants").
		Select("id, name, subscription_status, subscription_expires_at").
		Eq("owner_id", userID).
		Execute()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscription status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// StripeWebhook - handle Stripe event callbacks
func StripeWebhook(c *gin.Context) {
	const maxBodyBytes = int64(65536)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodyBytes)

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Error reading request body"})
		return
	}

	// Verify webhook signature when secret is configured
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	var event stripe.Event

	if webhookSecret != "" {
		sigHeader := c.GetHeader("Stripe-Signature")
		event, err = webhook.ConstructEvent(payload, sigHeader, webhookSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Webhook signature verification failed"})
			return
		}
	} else {
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload"})
			return
		}
	}

	switch event.Type {

	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Error parsing checkout session"})
			return
		}
		restaurantID := sess.Metadata["restaurant_id"]
		if restaurantID == "" {
			break
		}
		expiresAt := time.Now().AddDate(1, 0, 0)
		database.Query("restaurants").
			Update(map[string]interface{}{
				"subscription_status":     "active",
				"subscription_expires_at": expiresAt.Format(time.RFC3339),
				"stripe_customer_id":      sess.Customer,
				"stripe_subscription_id":  sess.Subscription,
			}, "", "").
			Eq("id", restaurantID).
			Execute()

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			break
		}
		// Find by stripe_subscription_id and deactivate
		database.Query("restaurants").
			Update(map[string]interface{}{
				"subscription_status": "expired",
			}, "", "").
			Eq("stripe_subscription_id", string(sub.ID)).
			Execute()

	case "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			break
		}
		status := "active"
		if sub.Status != stripe.SubscriptionStatusActive {
			status = string(sub.Status)
		}
		database.Query("restaurants").
			Update(map[string]interface{}{
				"subscription_status": status,
			}, "", "").
			Eq("stripe_subscription_id", string(sub.ID)).
			Execute()

	case "invoice.payment_failed":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			break
		}
		// Mark subscription as past_due so owner sees it in the dashboard
		database.Query("restaurants").
			Update(map[string]interface{}{
				"subscription_status": "past_due",
			}, "", "").
			Eq("stripe_customer_id", string(inv.Customer.ID)).
			Execute()
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}
