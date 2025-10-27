import express from 'express';
import { ChordController } from '../controllers/chordController.js';

const router = express.Router();

router.get('/', ChordController.getAll);
router.get('/:id', ChordController.getById);
router.post('/', ChordController.create);
router.put('/:id', ChordController.update);
router.delete('/:id', ChordController.remove);
router.patch('/:id', ChordController.patch);

export default router;