import express from 'express';
import { TuningController } from '../controllers/tuningController.js';

const router = express.Router();

router.get('/', TuningController.getAll);
router.get('/:id', TuningController.getById);
router.post('/', TuningController.create);
router.put('/:id', TuningController.update);
router.delete('/:id', TuningController.remove);

export default router;