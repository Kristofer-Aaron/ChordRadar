import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';
import { validateBody, validateQuery, ensureEmailUnique } from '../middlewares/validation.js';
import { loginSchema, registerSchema, verifySchema } from '../schemas/authSchemas.js';

const router = express.Router();

router.post('/login', requireEmailVerified, requireStatusActive, validateBody(loginSchema), AuthController.login);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validateBody(registerSchema), ensureEmailUnique('email_address'), AuthController.register);
router.get('/verify', validateQuery(verifySchema), AuthController.verify);

export default router;