import { Router } from 'express';
import { googleLogin, getCurrentUser, logout } from '../controllers/authentication.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';

const router = Router();

router.post('/google', googleLogin);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
