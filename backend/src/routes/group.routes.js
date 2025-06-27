import express from "express";
import { createGroup ,getAllGroups,joinGroup,searchGroup} from "../controllers/group.controller.js";
import {protectRoute} from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",protectRoute,createGroup);
router.get("/search",protectRoute,searchGroup);
router.get("/getAllGroups",protectRoute,getAllGroups)
router.post("/join/:groupId",protectRoute,joinGroup)
export default router;