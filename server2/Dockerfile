FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download && go build -o finedine-server ./cmd/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/finedine-server .
CMD ["./finedine-server"]
