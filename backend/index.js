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


dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);


export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5174", 
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join-room", (groupId) => {
    socket.join(groupId);
    console.log(`📦 ${socket.id} joined room: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5174",
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
