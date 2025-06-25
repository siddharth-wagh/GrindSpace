import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/lib/mongoose.config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import MessageRoute from "./src/routes/message.routes.js";
import authRoutes from "./src/routes/auth.routes.js"
import groupRoutes from "./src/routes/group.routes.js";
dotenv.config();    
const PORT = process.env.PORT;
const app = express();





app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", 
    credentials: true }));

app.use("/api/messages",MessageRoute);
app.use("/api/auth", authRoutes);
app.use("/api/group",groupRoutes);
const startServer = ()=>{

    app.listen(PORT,()=>{
        console.log(`Server started on port ${PORT}`);
    })
    connectDB()
}
startServer();