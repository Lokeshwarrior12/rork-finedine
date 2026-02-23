ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm AS builder

WORKDIR /usr/src/app

# Download dependencies first (better layer caching)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy all source
COPY . .

# Build from the correct entry point
RUN go build -v -o /run-app ./cmd/

FROM debian:bookworm-slim

# ca-certificates needed for HTTPS calls to Supabase, Stripe, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /run-app /usr/local/bin/run-app

EXPOSE 8080

CMD ["run-app"]
