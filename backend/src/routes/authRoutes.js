import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveToken } from '../middlewares/authentication.js';
import { validateBody, validateQuery } from '../middlewares/validation.js';
import { loginSchema, registerSchema, verifySchema } from '../schemas/authSchemas.js';

const router = express.Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/logout', authenticate, requireActiveToken, AuthController.logout);
router.post('/register', validateBody(registerSchema), AuthController.register);
router.get('/verify', validateQuery(verifySchema), AuthController.verify);

export default router;