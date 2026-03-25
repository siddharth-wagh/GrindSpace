import express from "express";
import {
  createServer,
  getMyServers,
  discoverServers,
  searchServers,
  getServer,
  updateServer,
  deleteServer,
  joinServer,
  leaveServer,
  getServerMembers,
  changeMemberRole,
  kickMember,
  generateInvite,
  joinByInviteCode,
} from "../controllers/server.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, upload.single("icon"), createServer);
router.get("/mine", protectRoute, getMyServers);
router.get("/discover", protectRoute, discoverServers);
router.get("/search", protectRoute, searchServers);
router.get("/join-by-code/:inviteCode", protectRoute, joinByInviteCode);
router.get("/:serverId", protectRoute, getServer);
router.put("/:serverId", protectRoute, upload.single("icon"), updateServer);
router.delete("/:serverId", protectRoute, deleteServer);
router.post("/:serverId/join", protectRoute, joinServer);
router.post("/:serverId/leave", protectRoute, leaveServer);
router.get("/:serverId/members", protectRoute, getServerMembers);
router.put("/:serverId/members/:userId/role", protectRoute, changeMemberRole);
router.delete("/:serverId/members/:userId", protectRoute, kickMember);
router.post("/:serverId/invite", protectRoute, generateInvite);

export default router;
