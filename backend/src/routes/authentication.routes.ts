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
import { demoLoginRateLimit } from '../middleware/demoLoginRateLimit.js';

const router = Router();

router.post('/google/login', loginWithGoogle);
router.post('/google/register', registerWithGoogle);
router.post('/demo/login', demoLoginRateLimit, loginWithDemoAccount);
router.post('/logout', authMiddleware, logout);
router.delete('/account', authMiddleware, deleteAccount);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/demo-accounts', authMiddleware, requireDemoAccountOwner, getDemoAccounts);
router.post('/demo-accounts', authMiddleware, requireDemoAccountOwner, createDemoAccount);
router.delete('/demo-accounts/:id', authMiddleware, requireDemoAccountOwner, removeDemoAccount);

export default router;
