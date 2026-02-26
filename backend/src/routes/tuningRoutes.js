import express from 'express';
import { TuningController } from '../controllers/tuningController.js';
import { TuningSchema } from '../schemas/tuningSchema.js';
import { validateBody } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/', TuningController.getAll);
router.get('/:id', TuningController.getById);
// Admin only routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validateBody(TuningSchema), TuningController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validateBody(TuningSchema), TuningController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, TuningController.remove);

export default router;