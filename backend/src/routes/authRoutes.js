import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';
import { validateBody, validateQuery, ensureEmailUnique } from '../middlewares/validation.js';
import { loginSchema, registerSchema, verifySchema } from '../schemas/authSchemas.js';
import { TwoFactorMethod } from '@prisma/client';
import { authorizeRole } from '../middlewares/authorization.js';

const router = express.Router();

router.post('/login', requireEmailVerified, requireStatusActive, validateBody(loginSchema), AuthController.login);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validateBody(registerSchema), ensureEmailUnique('email_address'), AuthController.register);
router.get('/verify', validateQuery(verifySchema), AuthController.verify);
router.post('/2fa/enroll', authenticate, requireActiveToken, AuthController.twoFaEnroll);
router.get('/2fa/qr-code', authenticate, requireActiveToken, AuthController.getQrPng)
router.post('/2fa/enroll-user/:id', authenticate, requireActiveToken, authorizeRole('admin'),  AuthController.twoFaEnroll);
router.post('/2fa/confirm', authenticate, requireActiveToken, AuthController.enrollConfirm);
router.post('/2fa/disable', authenticate, requireActiveToken, AuthController.twoFaDisable);

export default router;