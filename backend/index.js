import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/lib/mongoose.config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import MessageRoute from "./src/routes/message.route.js";
dotenv.config();    
const PORT = process.env.PORT;
const app = express();





app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", 
    credentials: true }));

app.use("/api/messages",MessageRoute);
const startServer = ()=>{

    app.listen(PORT,()=>{
        console.log(`Server started on port ${PORT}`);
    })
    connectDB()
}
startServer();