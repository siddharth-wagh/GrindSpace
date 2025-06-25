import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/lib/mongoose.config.js";
import authRoutes from "./routes/auth.routes.js"

dotenv.config();    
const PORT = process.env.PORT;
const app = express();

app.use("/api/auth", authRoutes);

const startServer = ()=>{
    app.listen(PORT,()=>{
        console.log(`Server started on port ${PORT}`)
    })
    connectDB()
}
startServer();