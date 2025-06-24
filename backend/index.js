import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/lib/mongoose.config.js";

dotenv.config();    
const PORT = process.env.PORT;
const app = express();
const startServer = ()=>{
    app.listen(PORT,()=>{
        console.log(`Server started on port ${PORT}`)
    })
    connectDB()
}
startServer();