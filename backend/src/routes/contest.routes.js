import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  createContest,
  importCfContest,
  randomProblems,
  getActiveContest,
  getScoreboard,
  endContest,
  getUpsolve,
} from "../controllers/contest.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createContest);
router.post("/import-cf", protectRoute, importCfContest);
router.post("/random-problems", protectRoute, randomProblems);
router.get("/channel/:channelId/active", protectRoute, getActiveContest);
router.get("/:contestId/scoreboard", protectRoute, getScoreboard);
router.post("/:contestId/end", protectRoute, endContest);
router.get("/:contestId/upsolve", protectRoute, getUpsolve);

export default router;
