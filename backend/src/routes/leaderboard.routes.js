import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getSquadLeaderboard } from "../controllers/leaderboard.controller.js";

const router = express.Router();

router.get("/squad/:serverId", protectRoute, getSquadLeaderboard);

export default router;
