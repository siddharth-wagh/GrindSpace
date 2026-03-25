import express from "express";
import {
    createGroup,
    getAllGroups,
    joinGroup,
    searchGroup,
    getGroupMembers,
    getGroupToken,
    leaveGroup,
    deleteGroup,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/create", upload.single("groupImage"), protectRoute, createGroup);
router.get("/search", protectRoute, searchGroup);
router.get("/getAllGroups", protectRoute, getAllGroups);
router.post("/join/:groupId", protectRoute, joinGroup);
router.post("/leave/:groupId", protectRoute, leaveGroup);
router.delete("/delete/:groupId", protectRoute, deleteGroup);
router.get("/:groupId/members", protectRoute, getGroupMembers);
router.get("/:groupId/token", protectRoute, getGroupToken);

export default router;