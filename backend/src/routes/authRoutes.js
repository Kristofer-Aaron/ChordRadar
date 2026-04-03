import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';
import { validate, ensureEmailUnique } from '../middlewares/validation.js';
import { loginBodySchema, loginQuerySchema, loginTotpBodySchema, loginTotpQuerySchema, registerBodySchema, verifyQuerySchema, totpConfirmBodySchema, totpDisableBodySchema } from '../schemas/authSchema.js';

const router = express.Router();

// Public routes
router.post('/login', requireEmailVerified, requireStatusActive, validate({ body: loginBodySchema, query: loginQuerySchema }), AuthController.login);
router.post('/login/totp', requireEmailVerified, requireStatusActive, validate({ body: loginTotpBodySchema, query: loginTotpQuerySchema }), AuthController.loginTotp);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validate({ body: registerBodySchema }), ensureEmailUnique('email_address'), AuthController.register);
router.get('/verify', validate({ query: verifyQuerySchema }), AuthController.verify);

// Protected routes
router.post('/totp/enroll', authenticate, requireActiveToken, AuthController.totpEnroll);
router.get('/totp/qr-code', authenticate, requireActiveToken, AuthController.getQrPng);
router.post('/totp/confirm', authenticate, requireActiveToken, validate({ body: totpConfirmBodySchema }), AuthController.totpConfirm);
router.post('/totp/disable', authenticate, requireActiveToken, validate({ body: totpDisableBodySchema }), AuthController.totpDisable);

export default router;