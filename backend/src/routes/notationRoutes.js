import express from 'express';
import { NotationController } from '../controllers/notationController.js';
import { NotationSchema } from '../schemas/notationSchema.js';
import { validateBody } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/', NotationController.getAll);
router.get('/:id', NotationController.getById);
//Admin only routes
router.post('/', authenticate, requireActiveToken, requireAdmin, validateBody(NotationSchema), NotationController.create);
router.put('/:id', authenticate, requireActiveToken, requireAdmin, validateBody(NotationSchema), NotationController.update);
router.delete('/:id', authenticate, requireActiveToken, requireAdmin, NotationController.remove);

export default router;