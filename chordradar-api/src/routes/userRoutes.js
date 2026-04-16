import express from 'express';
import { authenticate, requireActiveToken, requireAdmin, requireSelfOrAdmin } from '../middlewares/authentication.js';
import UserController from '../controllers/userController.js';
import { hashPasswordIfPresent, validate } from '../middlewares/validation.js';
import { getBySelectorParamsSchema, createUserBodySchema, patchUserBodySchema, idParamSchema } from '../schemas/userSchema.js';

const router = express.Router();

// Protected routes
router.get('/', authenticate, requireActiveToken, requireAdmin, UserController.getAll);
router.get('/:selector/:value', authenticate, requireActiveToken, requireSelfOrAdmin('selector', 'value'), validate({ params: getBySelectorParamsSchema }), UserController.getBySelector);
router.post('/', authenticate, requireActiveToken, requireAdmin, hashPasswordIfPresent, validate({ body: createUserBodySchema }), UserController.create);
router.patch('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: idParamSchema, body: patchUserBodySchema }), UserController.patch);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: idParamSchema }), UserController.remove);

export default router;