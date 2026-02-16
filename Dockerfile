# syntax = docker/dockerfile:1

# Build stage
FROM golang:1.21-alpine AS builder

LABEL fly_launch_runtime="Go"

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Copy go mod files - NOTE: FROM PROJECT ROOT, NOT NESTED
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download
RUN go mod verify

# Copy all source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /build/main \
    ./cmd/main.go

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/main .

# Expose port
EXPOSE 8080

# Set environment
ENV GIN_MODE=release

# Run the application
CMD ["/app/main"]
