FROM oven/bun:1.1.24-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .

EXPOSE 8080
CMD ["bun", "server.ts"]
