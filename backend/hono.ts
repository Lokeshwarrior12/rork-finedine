import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { timing, startTime, endTime } from "hono/timing";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { db } from "./db";

const app = new Hono();

let dbInitialized = false;

app.use("*", logger());
app.use("*", compress());
app.use("*", timing());

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Server-Timing'],
  maxAge: 86400,
  credentials: true,
}));

app.use(async (c, next) => {
  startTime(c, 'db-init');
  
  if (!dbInitialized) {
    try {
      await db.init();
      dbInitialized = true;
    } catch (error) {
      console.warn('Database initialization warning:', error);
    }
  }
  
  endTime(c, 'db-init');
  
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`[SLOW] [${c.req.method}] ${c.req.url} - ${duration}ms`);
  }
});

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  }, 500);
});

app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.url} not found`,
    timestamp: new Date().toISOString(),
  }, 404);
});

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "FineDine API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      trpc: "/api/trpc",
    }
  });
});

app.get("/health", async (c) => {
  let dbStatus = "operational";
  try {
    await db.init();
  } catch {
    dbStatus = "degraded";
  }
  
  return c.json({ 
    status: dbStatus === "operational" ? "healthy" : "degraded", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : undefined,
    services: {
      api: "operational",
      database: dbStatus,
    }
  });
});

export default app;
