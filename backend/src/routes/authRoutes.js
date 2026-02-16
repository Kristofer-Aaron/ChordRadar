import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';
import { validateBody, validateQuery, ensureEmailUnique } from '../middlewares/validation.js';
import { loginSchema, loginTotpSchema, registerSchema, verifySchema } from '../schemas/authSchemas.js';

const router = express.Router();

router.post('/login', requireEmailVerified, requireStatusActive, validateBody(loginSchema), AuthController.login);
router.post('/login/totp', requireEmailVerified, requireStatusActive, validateBody(loginTotpSchema), AuthController.loginTotp);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validateBody(registerSchema), ensureEmailUnique('email_address'), AuthController.register);
router.get('/verify', validateQuery(verifySchema), AuthController.verify);
router.post('/totp/enroll', authenticate, requireActiveToken, AuthController.totpEnroll);
router.get('/totp/qr-code', authenticate, requireActiveToken, AuthController.getQrPng);
router.post('/totp/confirm', authenticate, requireActiveToken, AuthController.totpConfirm);
router.post('/totp/disable', authenticate, requireActiveToken, AuthController.totpDisable);

export default router;