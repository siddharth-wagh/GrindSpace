import express from "express";
import { fetchProblemMeta } from "../controllers/codeforces.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/problem/:contestId/:index", protectRoute, fetchProblemMeta);

export default router;
