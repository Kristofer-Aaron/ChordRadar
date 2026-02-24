import express from 'express';
import { GripController } from '../controllers/gripController.js';

const router = express.Router();

router.get('/', GripController.getAll);
router.get('/:id', GripController.getById);
router.post('/', GripController.create);
router.put('/:id', GripController.update);
router.delete('/:id', GripController.remove);

export default router;