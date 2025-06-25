import express from "express";
import { createMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",protectRoute,createMessage);
export default router;