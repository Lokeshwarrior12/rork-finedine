# syntax=docker/dockerfile:1

############################
# Build Stage
############################
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# 👇 Copy Go module files from backend folder
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# 👇 Copy backend source
COPY backend .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o server main.go


############################
# Runtime Stage
############################
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/server .

ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["./server"]
