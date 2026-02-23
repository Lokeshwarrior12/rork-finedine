package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Dummy auth handlers for missing routes
func Register(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
func Login(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
func VerifyEmail(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
func ForgotPassword(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
func ResetPassword(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
func RefreshToken(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use client side SDK"})
}
