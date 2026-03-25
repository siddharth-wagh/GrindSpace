import express from "express";
import {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel,
  reorderChannels,
} from "../controllers/channel.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.post("/", protectRoute, createChannel);
router.get("/", protectRoute, getChannels);
router.put("/reorder", protectRoute, reorderChannels);
router.put("/:channelId", protectRoute, updateChannel);
router.delete("/:channelId", protectRoute, deleteChannel);

export default router;
