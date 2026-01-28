import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", env: "production" })
);

const port = Number(process.env.PORT || 8080);

console.log(`🚀 Backend running on :${port}`);

export default {
  port,
  fetch: app.fetch,
};
