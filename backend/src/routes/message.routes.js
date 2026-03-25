import express from "express";
import { createMessage, getMessages, deleteMessage, editMessage, toggleReaction } from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Channel messages
router.post("/channel/:channelId", protectRoute, upload.single("image"), createMessage);
router.get("/channel/:channelId", protectRoute, getMessages);

// Single message operations
router.delete("/:messageId", protectRoute, deleteMessage);
router.put("/:messageId", protectRoute, editMessage);
router.post("/:messageId/reactions", protectRoute, toggleReaction);

export default router;
