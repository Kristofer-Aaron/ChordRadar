import express from 'express';
import { TuningController } from '../controllers/tuningController.js';
import { tuningBodySchema, tuningIdParamSchema } from '../schemas/tuningSchema.js';
import { validate } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Public routes
router.get('/', TuningController.getAll);
router.get('/:id', validate({ params: tuningIdParamSchema }), TuningController.getById);

// Protected routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validate({ body: tuningBodySchema }), TuningController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: tuningIdParamSchema, body: tuningBodySchema }), TuningController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: tuningIdParamSchema }), TuningController.remove);

export default router;