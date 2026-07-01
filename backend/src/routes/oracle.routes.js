import express from "express";
import { askOracle } from "../controllers/oracle.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

const recentCalls = {};
const windowMs = 60 * 1000;
const maxPerWindow = 10;

function limitOracle(req, res, next) {
  const userId = req.user._id.toString();
  const now = Date.now();

  if (!recentCalls[userId]) recentCalls[userId] = [];
  recentCalls[userId] = recentCalls[userId].filter((t) => now - t < windowMs);

  if (recentCalls[userId].length >= maxPerWindow) {
    return res.status(429).json({ message: "Slow down, too many Oracle requests" });
  }

  recentCalls[userId].push(now);
  next();
}

router.post("/query", protectRoute, limitOracle, askOracle);

export default router;
