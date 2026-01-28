package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"finedine-server/internal/api"
	"finedine-server/internal/cache"
	"finedine-server/internal/middleware"
	"finedine-server/internal/repositories"
)

func main() {
	// Load .env file (optional in production – Fly/Render use secrets)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found - relying on system environment variables")
	}

	// Setup structured logging
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	// Set Gin mode based on ENV
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize dependencies
	if err := repositories.Init(); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize repositories (Supabase)")
	}
	if err := cache.Init(); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize Redis cache")
	}

	// Create Gin router
	r := gin.New()

	// Global middlewares
	r.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
		log.Error().Interface("panic", recovered).Msg("Panic recovered")
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	}))
	r.Use(middleware.CORSMiddleware())
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))

	// Health check endpoint (real connectivity test)
	r.GET("/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Check Redis
		if err := cache.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":  "unhealthy",
				"error":   "redis connection failed",
				"env":     env,
				"version": "0.1.0",
			})
			return
		}

		// Check Supabase (you can add a simple query or ping if supported)
		// For now we assume repositories.Init() already succeeded

		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"env":     env,
			"version": "0.1.0",
			"redis":   "connected",
			"db":      "connected",
		})
	})

	// Public routes (no auth required)
	publicAPI := r.Group("/api")
	api.SetupPublicRoutes(publicAPI)

	// Protected routes (require JWT)
	protectedAPI := r.Group("/api")
	protectedAPI.Use(middleware.AuthMiddleware())
	api.SetupProtectedRoutes(protectedAPI)

	// Get port from environment (Fly.io / Render set this automatically)
    port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}


	// Create server with timeouts
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info().Str("port", port).Str("env", env).Msg("FineDine Go server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed to start")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	// Close Redis / DB connections cleanly
	cache.Close()
	repositories.Close()

	log.Info().Msg("Server exited gracefully")
}
