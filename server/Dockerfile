
# -------- Build stage --------
RUN test ! -f package.json || (echo "❌ Frontend detected. Wrong Docker context." && exit 1)
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git (needed for go modules sometimes)
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app ./cmd

# -------- Runtime stage --------
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app .

EXPOSE 8080

CMD ["./app"]
