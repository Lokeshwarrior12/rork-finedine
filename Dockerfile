FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY backend/go.mod ./backend/
WORKDIR /app/backend
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/backend/main .
EXPOSE 8080
CMD ["./main"]
