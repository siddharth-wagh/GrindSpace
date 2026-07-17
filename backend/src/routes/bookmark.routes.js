import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { addBookmark, removeBookmark, getMyBookmarks } from "../controllers/bookmark.controller.js";

const router = express.Router();

router.post("/", protectRoute, addBookmark);
router.delete("/:contestId/:index", protectRoute, removeBookmark);
router.get("/mine", protectRoute, getMyBookmarks);

export default router;
