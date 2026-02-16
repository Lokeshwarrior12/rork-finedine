# syntax=docker/dockerfile:1

############################
# 1️⃣ Build Stage
############################
FROM golang:1.21-alpine AS builder

# Install build tools
RUN apk add --no-cache git gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go module files first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy all source code
COPY . .

# Build static binary (small + fast + production safe)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o server ./main.go


############################
# 2️⃣ Runtime Stage (Lightweight)
############################
FROM alpine:latest

# Install certificates + timezone
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Environment defaults
ENV PORT=8080
ENV GIN_MODE=release

# Expose API port
EXPOSE 8080

# Start server
CMD ["./server"]
