# syntax = docker/dockerfile:1

ARG BUN_VERSION=1.1.24
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

WORKDIR /app
ENV NODE_ENV="production"


# -------------------------
# Build stage
# -------------------------
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential pkg-config python-is-python3

# 👇 install backend dependencies (THIS IS THE KEY FIX)
WORKDIR /app/backend
COPY backend/package.json backend/bun.lockb* ./
RUN bun install --ci

# copy backend source
COPY backend ./


# -------------------------
# Final runtime stage
# -------------------------
FROM base

WORKDIR /app/backend
COPY --from=build /app/backend /app/backend

EXPOSE 8080

CMD ["bun", "run", "start"]
