import express from "express";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT;
const app = express();
const startServer = ()=>{
    app.listen(PORT,()=>{
        console.log(`Server started on port ${PORT}`)
    })
}
startServer();