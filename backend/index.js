import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./src/lib/mongoose.config.js";
import authRoutes from "./src/routes/auth.routes.js";
import serverRoutes from "./src/routes/server.routes.js";
import channelRoutes from "./src/routes/channel.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import friendRoutes from "./src/routes/friend.routes.js";
import ledgerRoutes from "./src/routes/ledger.routes.js";
import problemRoutes from "./src/routes/problem.routes.js";
import leaderboardRoutes from "./src/routes/leaderboard.routes.js";
import cpRoutes from "./src/routes/cp.routes.js";
import contestRoutes from "./src/routes/contest.routes.js";
import { startCfPoller } from "./src/lib/cfPoller.js";
import { startCronJobs } from "./src/lib/cron.js";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";
import User from "./src/models/user.model.js";

dotenv.config();
const PORT = process.env.PORT || 8000;

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

export const userSocketMap = {};
export const contestRoomMembers = {};

if (process.env.REDIS_URL) {
  try {
    const pubClient = new IORedis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO using Redis adapter");
  } catch (err) {
    console.log("redis adapter failed", err.message);
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user-online", async (userId) => {
    if (!userId) return;
    userSocketMap[socket.id] = userId;
    try {
      await User.findByIdAndUpdate(userId, { status: "online" });
    } catch (_) {}
    io.emit("user-status-change", { userId, status: "online" });
  });

  socket.on("join-channel", (channelId) => {
    socket.join(`channel:${channelId}`);
    const userId = userSocketMap[socket.id];
    if (userId) {
      if (!contestRoomMembers[channelId]) contestRoomMembers[channelId] = new Set();
      contestRoomMembers[channelId].add(userId);
    }
  });

  socket.on("leave-channel", (channelId) => {
    socket.leave(`channel:${channelId}`);
    const userId = userSocketMap[socket.id];
    if (userId && contestRoomMembers[channelId]) {
      contestRoomMembers[channelId].delete(userId);
    }
  });

  socket.on("join-server", (serverId) => {
    socket.join(`server:${serverId}`);
  });

  socket.on("leave-server", (serverId) => {
    socket.leave(`server:${serverId}`);
  });

  socket.on("typing-start", ({ channelId, userId, username }) => {
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("user-typing", { userId, username });
    }
  });

  socket.on("typing-stop", ({ channelId, userId }) => {
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("user-stopped-typing", { userId });
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    const userId = userSocketMap[socket.id];
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { status: "offline" });
      } catch (_) {}
      io.emit("user-status-change", { userId, status: "offline" });

      for (const channelId in contestRoomMembers) {
        contestRoomMembers[channelId]?.delete(userId);
      }

      delete userSocketMap[socket.id];
    }
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/servers/:serverId/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/cp", cpRoutes);
app.use("/api/contests", contestRoutes);

const startServer = () => {
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
  connectDB();
  startCfPoller();
  startCronJobs();
};

startServer();
