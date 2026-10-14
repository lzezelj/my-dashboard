import { Router } from 'express';
import {
  getCurrentUser,
  loginWithGoogle,
  logout,
  registerWithGoogle,
} from '../controllers/authentication.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';

const router = Router();

router.post('/google/login', loginWithGoogle);
router.post('/google/register', registerWithGoogle);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
