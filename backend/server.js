import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ------------------ Middleware ------------------ */
app.use(cors());
app.use(express.json());

/* ------------------ Supabase ------------------ */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase env vars missing");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/* ------------------ Socket.IO ------------------ */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

/* ------------------ Routes ------------------ */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

/* ------------------ Start Server ------------------ */
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
