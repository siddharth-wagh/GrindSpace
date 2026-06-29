import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  unfurlProblem,
  markSolved,
  getMySolves,
} from "../controllers/problem.controller.js";

const router = express.Router();

router.post("/unfurl", protectRoute, unfurlProblem);
router.post("/solve", protectRoute, markSolved);
router.get("/mine", protectRoute, getMySolves);

export default router;
