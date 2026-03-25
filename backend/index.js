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
import dmRoutes from "./src/routes/dm.routes.js";
import friendRoutes from "./src/routes/friend.routes.js";
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

// ─── Shared State ────────────────────────────────────────────────────────────
export const userSocketMap = {}; // { socketId: userId }
const voiceChannelMembers = {}; // { channelId: Set<socketId> }

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ── Online Status ─────────────────────────────────────────────────────────
  socket.on("user-online", async (userId) => {
    if (!userId) return;
    userSocketMap[socket.id] = userId;
    try {
      await User.findByIdAndUpdate(userId, { status: "online" });
    } catch (_) {}
    io.emit("user-status-change", { userId, status: "online" });
  });

  // ── Channel Rooms (text channels in servers) ──────────────────────────────
  socket.on("join-channel", (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on("leave-channel", (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  // ── Server Room (for server-wide events) ──────────────────────────────────
  socket.on("join-server", (serverId) => {
    socket.join(`server:${serverId}`);
  });

  socket.on("leave-server", (serverId) => {
    socket.leave(`server:${serverId}`);
  });

  // ── DM / Conversation Rooms ───────────────────────────────────────────────
  socket.on("join-conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // ── Typing Indicators ─────────────────────────────────────────────────────
  socket.on("typing-start", ({ channelId, conversationId, userId, username }) => {
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("user-typing", { userId, username });
    } else if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit("user-typing", { userId, username });
    }
  });

  socket.on("typing-stop", ({ channelId, conversationId, userId }) => {
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("user-stopped-typing", { userId });
    } else if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit("user-stopped-typing", { userId });
    }
  });

  // ── Voice Channels ────────────────────────────────────────────────────────
  socket.on("join-voice", (channelId) => {
    if (!voiceChannelMembers[channelId]) {
      voiceChannelMembers[channelId] = new Set();
    }
    voiceChannelMembers[channelId].add(socket.id);
    socket.join(`voice:${channelId}`);

    // Notify others in the voice channel
    socket.to(`voice:${channelId}`).emit("new-peer", { from: socket.id });

    // Broadcast updated participant list
    broadcastVoiceState(channelId);
  });

  socket.on("leave-voice", (channelId) => {
    voiceChannelMembers[channelId]?.delete(socket.id);
    socket.leave(`voice:${channelId}`);
    socket.to(`voice:${channelId}`).emit("peer-disconnected", socket.id);
    broadcastVoiceState(channelId);
  });

  socket.on("voice-state-update", ({ channelId, muted, deafened }) => {
    socket.to(`voice:${channelId}`).emit("voice-state-update", {
      socketId: socket.id,
      userId: userSocketMap[socket.id],
      muted,
      deafened,
    });
  });

  // ── WebRTC Signaling (shared for voice channels + DM calls) ───────────────
  socket.on("offer", ({ to, sdp }) => {
    io.to(to).emit("offer", { from: socket.id, sdp });
  });

  socket.on("answer", ({ to, sdp }) => {
    io.to(to).emit("answer", { from: socket.id, sdp });
  });

  socket.on("candidate", ({ to, candidate }) => {
    io.to(to).emit("candidate", { from: socket.id, candidate });
  });

  // ── DM Calls ──────────────────────────────────────────────────────────────
  socket.on("dm-call-initiate", ({ conversationId, callType }) => {
    socket.to(`conversation:${conversationId}`).emit("dm-call-ring", {
      conversationId,
      from: userSocketMap[socket.id],
      callType,
    });
  });

  socket.on("dm-call-accept", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("dm-call-accepted", {
      conversationId,
      from: socket.id,
    });
  });

  socket.on("dm-call-decline", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("dm-call-declined", {
      conversationId,
    });
  });

  socket.on("dm-call-end", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("dm-call-ended", {
      conversationId,
    });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    const userId = userSocketMap[socket.id];
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { status: "offline" });
      } catch (_) {}
      io.emit("user-status-change", { userId, status: "offline" });
      delete userSocketMap[socket.id];
    }

    // Clean up voice channel memberships
    for (const channelId in voiceChannelMembers) {
      if (voiceChannelMembers[channelId].has(socket.id)) {
        voiceChannelMembers[channelId].delete(socket.id);
        io.to(`voice:${channelId}`).emit("peer-disconnected", socket.id);
        broadcastVoiceState(channelId);
      }
    }
  });
});

function broadcastVoiceState(channelId) {
  const members = voiceChannelMembers[channelId];
  const participants = members
    ? [...members].map((sid) => ({
        socketId: sid,
        userId: userSocketMap[sid],
      }))
    : [];
  io.to(`voice:${channelId}`).emit("voice-channel-update", {
    channelId,
    participants,
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/servers/:serverId/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/friends", friendRoutes);

// ─── Start ───────────────────────────────────────────────────────────────────
const startServer = () => {
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
  connectDB();
};

startServer();
