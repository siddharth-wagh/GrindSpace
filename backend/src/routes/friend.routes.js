import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  searchUsers,
} from "../controllers/friend.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getFriends);
router.get("/requests", protectRoute, getFriendRequests);
router.get("/search", protectRoute, searchUsers);
router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:userId", protectRoute, acceptFriendRequest);
router.post("/decline/:userId", protectRoute, declineFriendRequest);
router.delete("/:userId", protectRoute, removeFriend);

export default router;
