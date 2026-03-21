import express from 'express';
import { GripController } from '../controllers/gripController.js';
import { GripSchema } from '../schemas/gripSchema.js';
import { validateBody } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/', GripController.getAll);
router.get('/:id', GripController.getById);
// Admin only routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validateBody(GripSchema), GripController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validateBody(GripSchema), GripController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, GripController.remove);

export default router;