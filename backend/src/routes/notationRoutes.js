import express from 'express';
import { NotationController } from '../controllers/notationController.js';
import { notationBodySchema, notationIdParamSchema } from '../schemas/notationSchema.js';
import { validate } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Public routes
router.get('/', NotationController.getAll);
router.get('/:id', validate({ params: notationIdParamSchema }), NotationController.getById);

// Protected routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validate({ body: notationBodySchema }), NotationController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: notationIdParamSchema, body: notationBodySchema }), NotationController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: notationIdParamSchema }), NotationController.remove);

export default router;