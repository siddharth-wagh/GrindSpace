import express from "express";
import { createMessage ,getAllMessagesFromGroup} from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create/:groupId",protectRoute,createMessage);
router.get("/getAllMessages/:groupId",protectRoute,getAllMessagesFromGroup);
export default router;