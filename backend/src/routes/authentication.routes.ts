import { Router } from 'express';
import {
  createDemoAccount,
  getDemoAccounts,
  getCurrentUser,
  deleteAccount,
  loginWithDemoAccount,
  loginWithGoogle,
  logout,
  registerWithGoogle,
  removeDemoAccount,
  requireDemoAccountOwner,
} from '../controllers/authentication.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';
import { authenticationRateLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/google/login', authenticationRateLimiter, loginWithGoogle);
router.post('/google/register', authenticationRateLimiter, registerWithGoogle);
router.post('/demo/login', authenticationRateLimiter, loginWithDemoAccount);
router.post('/logout', authMiddleware, logout);
router.delete('/account', authMiddleware, deleteAccount);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/demo-accounts', authMiddleware, requireDemoAccountOwner, getDemoAccounts);
router.post('/demo-accounts', authMiddleware, requireDemoAccountOwner, createDemoAccount);
router.delete('/demo-accounts/:id', authMiddleware, requireDemoAccountOwner, removeDemoAccount);

export default router;
