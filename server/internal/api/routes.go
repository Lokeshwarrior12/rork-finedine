package api

import (
	"github.com/gin-gonic/gin"
)

func SetupPublicRoutes(r *gin.RouterGroup) {
	r.GET("/restaurants", getRestaurantsHandler)
	r.GET("/restaurants/:id", getRestaurantByIDHandler)
	r.GET("/restaurants/:id/menu", getMenuItemsHandler)
}

func SetupProtectedRoutes(r *gin.RouterGroup) {
	r.GET("/profile", getProfileHandler)
	r.PATCH("/profile", updateProfileHandler)

	r.GET("/orders", getOrdersHandler)
	r.GET("/orders/:id", getOrderByIDHandler)
	r.POST("/orders", createOrderHandler)
	r.PATCH("/orders/:id", updateOrderStatusHandler)

	r.POST("/menu", createMenuItemHandler)
	r.PATCH("/menu/:id", updateMenuItemHandler)
	r.DELETE("/menu/:id", deleteMenuItemHandler)

	r.GET("/restaurant/orders", getRestaurantOrdersHandler)
}
