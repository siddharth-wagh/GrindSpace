import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  startOrGetConversation,
  getMyConversations,
  getDirectMessages,
  sendDirectMessage,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/start", protectRoute, startOrGetConversation);
router.get("/mine", protectRoute, getMyConversations);
router.get("/:conversationId/messages", protectRoute, getDirectMessages);
router.post("/:conversationId/messages", protectRoute, sendDirectMessage);

export default router;
