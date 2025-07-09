import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./src/lib/mongoose.config.js";
import MessageRoute from "./src/routes/message.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import groupRoutes from "./src/routes/group.routes.js";
import Message from "./src/models/message.model.js";
import Group from "./src/models/group.model.js";
dotenv.config();
const PORT = process.env.PORT || 8000;

const app = express();
const httpServer = createServer(app);


export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", 
    credentials: true,
  }
});
const groupCallMembers = {};
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("send-message", async ({ groupId, text, image, sender }) => {
  try {
    // Save the message to the database
    const newMessage = new Message({
      group: groupId,
      text,
      image,
      sender,
    });

    await newMessage.save();

    // Populate sender for frontend use (if needed)
    await newMessage.populate("sender", "name _id");

    // Broadcast to everyone in the group
    io.to(groupId).emit("new-message", newMessage);
  } catch (error) {
    console.error("❌ Failed to send message:", error);
  }
});
  socket.on("join-room", (groupId) => {
    socket.join(groupId);
    console.log(`📦 ${socket.id} joined room: ${groupId}`);
  });

    
  socket.on('join-call', (groupId) => {
    if (!groupCallMembers[groupId]) {
      groupCallMembers[groupId] = new Set();
    }
    groupCallMembers[groupId].add(socket.id);

    // Notify others in the same room
    socket.to(groupId).emit('new-peer', { from: socket.id });
  });

  socket.on('offer', ({ to, sdp }) => {
    io.to(to).emit('offer', { from: socket.id, sdp });
  });

 socket.on('answer', ({ to, sdp }) => {
    io.to(to).emit('answer', { from: socket.id, sdp });
  });

  socket.on('candidate', ({ to, candidate }) => {
    io.to(to).emit('candidate', { from: socket.id, candidate });
  });

  socket.on('leave-call', (groupId) => {
    groupCallMembers[groupId]?.delete(socket.id);
    socket.to(groupId).emit('peer-disconnected', socket.id);
  });

  socket.on('disconnect', () => {
    // Remove from all group call sets
    for (const groupId in groupCallMembers) {
      if (groupCallMembers[groupId].has(socket.id)) {
        groupCallMembers[groupId].delete(socket.id);
        io.to(groupId).emit('peer-disconnected', socket.id);
      }
    }
  });


});  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/api/messages", MessageRoute);
app.use("/api/auth", authRoutes);
app.use("/api/group", groupRoutes);


const startServer = () => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
  });

  connectDB();
};

startServer();
