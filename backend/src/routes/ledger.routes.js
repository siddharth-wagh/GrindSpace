import express from "express";
import { getChannelLedger, getSquadLedger } from "../controllers/ledger.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/channel/:channelId", protectRoute, getChannelLedger);
router.get("/squad/:serverId", protectRoute, getSquadLedger);

export default router;
