import express from "express";
import {
  createDM,
  createGroupDM,
  getConversations,
  getDMMessages,
  sendDMMessage,
} from "../controllers/dm.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, createDM);
router.post("/group/create", protectRoute, createGroupDM);
router.get("/conversations", protectRoute, getConversations);
router.get("/:conversationId/messages", protectRoute, getDMMessages);
router.post("/:conversationId/messages", protectRoute, upload.single("image"), sendDMMessage);

export default router;
