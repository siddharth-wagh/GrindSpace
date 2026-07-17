import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  unfurlProblem,
  getMySolves,
  refreshMySolves,
} from "../controllers/problem.controller.js";

const router = express.Router();

router.post("/unfurl", protectRoute, unfurlProblem);
router.get("/mine", protectRoute, getMySolves);
router.post("/mine/refresh", protectRoute, refreshMySolves);

export default router;
