import express from 'express';
const router = express.Router();
import { signup, login, checkauth } from '../controllers/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

router.post('/signup',signup)
router.post('/login', login)
router.get('/check',protectRoute, checkauth )

