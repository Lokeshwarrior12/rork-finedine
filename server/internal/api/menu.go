package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"finedine-server/internal/cache"
	"finedine-server/internal/middleware"
	"finedine-server/internal/repositories"
)

func getMenuItemsHandler(c *gin.Context) {
	restaurantID := c.Param("id")

	cacheKey := cache.GenerateKey("menu", map[string]interface{}{"restaurant": restaurantID})

	ctx := c.Request.Context()
	cached, err := cache.Get(ctx, cacheKey)
	if err == nil && cached != nil {
		var result []repositories.MenuItem
		if json.Unmarshal(cached, &result) == nil {
			c.JSON(http.StatusOK, gin.H{
				"items":  result,
				"count":  len(result),
				"cached": true,
			})
			return
		}
	}

	items, err := repositories.GetMenuItems(ctx, restaurantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	data, _ := json.Marshal(items)
	cache.Set(ctx, cacheKey, data, 5*time.Minute)

	c.JSON(http.StatusOK, gin.H{
		"items":  items,
		"count":  len(items),
		"cached": false,
	})
}

func createMenuItemHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if role != "restaurant_owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var item repositories.MenuItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := c.Request.Context()
	created, err := repositories.CreateMenuItem(ctx, &item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cacheKey := cache.GenerateKey("menu", map[string]interface{}{"restaurant": item.RestaurantID})
	cache.Delete(ctx, cacheKey)

	c.JSON(http.StatusCreated, gin.H{"item": created})
}

func updateMenuItemHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if role != "restaurant_owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	itemID := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	delete(updates, "id")
	delete(updates, "restaurant_id")

	ctx := c.Request.Context()
	updated, err := repositories.UpdateMenuItem(ctx, itemID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if restaurantID, ok := updates["restaurant_id"].(string); ok {
		cacheKey := cache.GenerateKey("menu", map[string]interface{}{"restaurant": restaurantID})
		cache.Delete(ctx, cacheKey)
	}

	c.JSON(http.StatusOK, gin.H{"item": updated})
}

func deleteMenuItemHandler(c *gin.Context) {
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if role != "restaurant_owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	itemID := c.Param("id")
	ctx := c.Request.Context()

	if err := repositories.DeleteMenuItem(ctx, itemID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu item deleted"})
}
