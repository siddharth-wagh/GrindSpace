import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getHeatmap, getDashboard, getStreak } from "../controllers/cp.controller.js";

const router = express.Router();

router.get("/heatmap/:userId", protectRoute, getHeatmap);
router.get("/dashboard/:userId", protectRoute, getDashboard);
router.get("/streak/:userId", protectRoute, getStreak);

export default router;
