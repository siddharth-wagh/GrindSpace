import express from 'express';
const router = express.Router();
import { signup, login, checkauth, updateProfile, logout } from '../controllers/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

router.post('/signup',signup)
router.post('/login', login)
router.get('/check',protectRoute, checkauth )

router.put("/update-profile", protectRoute, updateProfile)
router.post('/logout', logout)

