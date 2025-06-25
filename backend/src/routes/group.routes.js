import express from "express";
import { createGroup } from "../controllers/group.controller.js";
import {protectRoute} from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",protectRoute,createGroup);


export default router;