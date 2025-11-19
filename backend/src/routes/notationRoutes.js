import express from 'express';
import { NotationController } from '../controllers/notationController.js';

const router = express.Router();

router.get('/', NotationController.getAll);
router.get('/:id', NotationController.getById);
router.post('/', NotationController.create);
router.put('/:id', NotationController.update);
router.delete('/:id', NotationController.remove);

export default router;