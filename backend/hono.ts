import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./db";

const app = new Hono();

let dbInitialized = false;

app.use("*", cors());

app.use("*", async (c, next) => {
  if (!dbInitialized) {
    try {
      await db.init();
      dbInitialized = true;
    } catch (error) {
      console.warn("Database initialization warning:", error);
    }
  }
  await next();
});

app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    { error: "Internal Server Error", message: err.message },
    500
  );
});

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "PrimeDine REST API is running",
    version: "1.0.0",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/v1/restaurants", async (c) => {
  try {
    const q = c.req.query("q");
    const cuisineType = c.req.query("cuisineType");
    const category = c.req.query("category");
    const data = await db.restaurants.search(q, cuisineType, category);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.restaurants.getById(id);
    if (!data) return c.json({ error: "Restaurant not found" }, 404);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id/menu", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.menuItems.getByRestaurantId(id);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/deals", async (c) => {
  try {
    const data = await db.deals.getActive();
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/deals/featured", async (c) => {
  try {
    const data = await db.deals.getActive();
    return c.json({ data: data.slice(0, 10) });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/profile", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const data = await db.users.getById(userId);
    if (!data) return c.json({ error: "User not found" }, 404);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put("/v1/profile", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const body = await c.req.json();
    const data = await db.users.update(userId, body);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/v1/orders", async (c) => {
  try {
    const body = await c.req.json();
    const data = await db.orders.create(body);
    return c.json({ data }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/orders", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const data = await db.orders.getByCustomerId(userId);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/orders/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.orders.getById(id);
    if (!data) return c.json({ error: "Order not found" }, 404);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.patch("/v1/orders/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const data = await db.orders.update(id, { status });
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/v1/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const data = await db.tableBookings.create(body);
    return c.json({ data }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/bookings", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const data = await db.tableBookings.getByUserId(userId);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/favorites", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const user = await db.users.getById(userId);
    if (!user) return c.json({ error: "User not found" }, 404);
    const favoriteIds = user.favorites || [];
    const restaurants = await Promise.all(
      favoriteIds.map((id: string) => db.restaurants.getById(id))
    );
    const data = restaurants.filter(Boolean).map((r, i) => ({
      id: `fav-${i}`,
      userId,
      restaurantId: favoriteIds[i],
      restaurant: r,
    }));
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/notifications", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const userId = authHeader.replace("Bearer ", "");
    const data = await db.notifications.getByUserId(userId);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id/orders", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.orders.getByRestaurantId(id);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id/inventory", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.inventory.getByRestaurantId(id);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id/bookings", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.tableBookings.getByRestaurantId(id);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/v1/restaurants/:id/deals", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await db.deals.getByRestaurantId(id);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
