import express from "express";
import { createGroup ,getAllGroups,joinGroup,searchGroup,makeColeader,getAllUsersInGroup} from "../controllers/group.controller.js";
import {protectRoute} from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",protectRoute,createGroup);
router.get("/search",protectRoute,searchGroup);
router.get("/getAllGroups",protectRoute,getAllGroups)
router.post("/join/:groupId",protectRoute,joinGroup)
router.post("/makeColeader/:groupId",protectRoute,makeColeader);
router.get("/getAllUsersInGroup/:groupId", protectRoute, getAllUsersInGroup);
export default router;