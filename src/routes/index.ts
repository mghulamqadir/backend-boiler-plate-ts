import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import paymentRoutes from './payment.routes.js';
import mediaRoutes from './media.routes.js';
import { authLimiter } from '../utils/rateLimit.js';

import { Router } from 'express';

const router = Router();
router.use('/api/auth', authLimiter, authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/media', mediaRoutes);

export default router;