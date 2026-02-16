FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy only go.mod first (skip go.sum)
COPY backend/go.mod ./backend/
WORKDIR /app/backend
RUN go mod download

# Copy rest of backend source
COPY backend/ .

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main .

# ---- runtime image ----
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/backend/main .
EXPOSE 8080
CMD ["./main"]
