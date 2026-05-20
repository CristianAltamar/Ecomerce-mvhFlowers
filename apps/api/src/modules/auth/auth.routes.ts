import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema, refreshSchema } from './auth.schemas';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rate-limit';

const router: Router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.get('/me', requireAuth, authController.me);

export const authRouter = router;
