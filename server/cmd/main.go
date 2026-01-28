package main

import (
	"context"
	"fmt"
	stdlog "log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	zlog "github.com/rs/zerolog/log"

	"finedine-server/internal/api"
	"finedine-server/internal/cache"
	"finedine-server/internal/middleware"
	"finedine-server/internal/repositories"
)

func main() {
	// Load .env (optional in production)
	if err := godotenv.Load(); err != nil {
		stdlog.Println("No .env file found - using environment variables")
	}

	// Structured logging
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zlog.Logger = zlog.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	// Environment
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize repositories (Supabase)
	if err := repositories.Init(); err != nil {
		zlog.Error().Err(err).Msg("Supabase init failed (continuing)")
	}

	// Initialize cache (Redis)
	if err := cache.Init(); err != nil {
		zlog.Error().Err(err).Msg("Redis init failed (continuing)")
	}

	// Router
	r := gin.New()

	// Middlewares
	r.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
		zlog.Error().Interface("panic", recovered).Msg("panic recovered")
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"error": "internal server error",
		})
	}))

	r.Use(middleware.CORSMiddleware())

	r.Use(gin.LoggerWithFormatter(func(p gin.LogFormatterParams) string {
		return fmt.Sprintf(
			"%s - [%s] \"%s %s %s\" %d %s \"%s\" %s\n",
			p.ClientIP,
			p.TimeStamp.Format(time.RFC1123),
			p.Method,
			p.Path,
			p.Request.Proto,
			p.StatusCode,
			p.Latency,
			p.Request.UserAgent(),
			p.ErrorMessage,
		)
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		redisStatus := "connected"
		if err := cache.Ping(ctx); err != nil {
			redisStatus = "unavailable"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"env":     env,
			"version": "0.1.0",
			"redis":   redisStatus,
			"db":      "connected",
		})
	})

	// Routes
	publicAPI := r.Group("/api")
	api.SetupPublicRoutes(publicAPI)

	protectedAPI := r.Group("/api")
	protectedAPI.Use(middleware.AuthMiddleware())
	api.SetupProtectedRoutes(protectedAPI)

	// Port (Fly injects PORT)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := "0.0.0.0:" + port

	// HTTP server
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	// Start server
	go func() {
		zlog.Info().
			Str("addr", addr).
			Str("env", env).
			Msg("FineDine API server started")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zlog.Fatal().Err(err).Msg("server crashed")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	zlog.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		zlog.Error().Err(err).Msg("forced shutdown")
	}

	cache.Close()
	repositories.Close()

	zlog.Info().Msg("Server exited cleanly")
}
