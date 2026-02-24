import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';
import { validateBody, validateQuery, ensureEmailUnique } from '../middlewares/validation.js';
import { loginSchema, loginTotpSchema, registerSchema, verifySchema } from '../schemas/authSchemas.js';

const router = express.Router();

router.post('/login', requireEmailVerified, requireStatusActive, validateBody(loginSchema), AuthController.login);
router.post('/login/2fa', requireEmailVerified, requireStatusActive, validateBody(loginTotpSchema), AuthController.loginTotp);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validateBody(registerSchema), ensureEmailUnique('email_address'), AuthController.register);
router.get('/verify', validateQuery(verifySchema), AuthController.verify);
router.post('/2fa/enroll', authenticate, requireActiveToken, AuthController.twoFaEnroll);
router.get('/2fa/qr-code', authenticate, requireActiveToken, AuthController.getQrPng);
router.post('/2fa/confirm', authenticate, requireActiveToken, AuthController.twoFaConfirm);
router.post('/2fa/disable', authenticate, requireActiveToken, AuthController.twoFaDisable);

export default router;