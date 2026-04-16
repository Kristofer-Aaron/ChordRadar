import express from 'express';
import { GripController } from '../controllers/gripController.js';
import { gripBodySchema, gripIdParamSchema } from '../schemas/gripSchema.js';
import { validate } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Public routes
router.get('/', GripController.getAll);
router.get('/:id', validate({ params: gripIdParamSchema }), GripController.getById);

// Protected routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validate({ body: gripBodySchema }), GripController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: gripIdParamSchema, body: gripBodySchema }), GripController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: gripIdParamSchema }), GripController.remove);

export default router;