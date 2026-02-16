# ---------- BUILD STAGE ----------
FROM golang:1.22-alpine AS builder

WORKDIR /app

# copy go files
COPY backend/go.mod ./backend/
WORKDIR /app/backend
RUN go mod download

# copy source
COPY backend/ .

# build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main .

# ---------- RUNTIME STAGE ----------
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/backend/main .

EXPOSE 8080

CMD ["./main"]
