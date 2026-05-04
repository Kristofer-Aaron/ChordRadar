import express from 'express';
import ratelimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import { validate } from '../middlewares/validation.js';
import { loginQuerySchema, loginBodySchema, loginTotpBodySchema, loginTotpQuerySchema, registerBodySchema, verifyQuerySchema, totpConfirmBodySchema, totpDisableBodySchema } from '../schemas/authSchema.js';
import { selfPatchUserBodySchema } from '../schemas/userSchema.js';
import { authenticate, requireActiveToken, requireAdmin, requireEmailVerified, requireStatusActive } from '../middlewares/authentication.js';

const router = express.Router();

const loginLimiter = ratelimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// Public routes
router.post('/login', loginLimiter, requireEmailVerified, requireStatusActive, validate({ query: loginQuerySchema, body: loginBodySchema }), AuthController.login);
router.post('/login/totp', requireEmailVerified, requireStatusActive, validate({ body: loginTotpBodySchema, query: loginTotpQuerySchema }), AuthController.loginTotp);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validate({ body: registerBodySchema }), /*ensureEmailUnique('email_address'),*/ AuthController.register);
router.get('/verify', validate({ query: verifyQuerySchema }), AuthController.verify);

// Protected routes
router.post('/login/gui', requireEmailVerified, requireStatusActive, requireAdmin, validate({ body: loginBodySchema }), AuthController.login);
router.post('/totp/enroll', authenticate, requireActiveToken, AuthController.totpEnroll);
router.get('/totp/qr-code', authenticate, requireActiveToken, AuthController.getQrPng);
router.post('/totp/confirm', authenticate, requireActiveToken, validate({ body: totpConfirmBodySchema }), AuthController.totpConfirm);
router.post('/totp/disable', authenticate, requireActiveToken, validate({ body: totpDisableBodySchema }), AuthController.totpDisable);
router.patch('/me', authenticate, requireActiveToken, validate({ body: selfPatchUserBodySchema }), UserController.patchSelf);
router.delete('/me', authenticate, requireActiveToken, UserController.removeSelf);

export default router;