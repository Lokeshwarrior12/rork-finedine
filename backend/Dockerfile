# -------------------------
# Build stage
# -------------------------
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy backend go files
COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend

RUN go mod download

# Copy backend source
COPY backend .

# Build Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# -------------------------
# Runtime stage
# -------------------------
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy compiled binary
COPY --from=builder /app/backend/main ./main

EXPOSE 8080
ENV PORT=8080

CMD ["./main"]
