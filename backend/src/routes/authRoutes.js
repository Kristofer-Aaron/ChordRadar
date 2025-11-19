import express from 'express';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify', AuthController.verify);

export default router;