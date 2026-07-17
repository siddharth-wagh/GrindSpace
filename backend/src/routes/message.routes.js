import express from "express";
import { createMessage, getMessages, deleteMessage, editMessage, getThreadReplies } from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/channel/:channelId", protectRoute, createMessage);
router.get("/channel/:channelId", protectRoute, getMessages);
router.get("/thread/:messageId", protectRoute, getThreadReplies);

router.delete("/:messageId", protectRoute, deleteMessage);
router.put("/:messageId", protectRoute, editMessage);

export default router;
