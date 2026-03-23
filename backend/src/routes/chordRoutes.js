// routes/chordRoutes.js
import express from 'express';
import { ChordController } from '../controllers/chordController.js';
import { createChordSchema, patchChordSchema } from '../schemas/chordSchema.js';
import { validateBody } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Public routes
router.get('/user-chords', authenticate, requireActiveToken, ChordController.getUserChords);
router.get('/', ChordController.getAll);
router.get('/:id', ChordController.getById);
router.get('/:selector/:selectorValue/tuning/:tuningValue', ChordController.getBySelector);

// Protected routes
router.post('/', authenticate, requireActiveToken, validateBody(createChordSchema), ChordController.create);
//router.put('/:id', authenticate, requireActiveToken, requireAdmin, ChordController.update);
router.patch('/:id', authenticate, requireActiveToken, requireAdmin, ChordController.patch);
router.delete('/:id', authenticate, requireActiveToken, validateBody(patchChordSchema), ChordController.remove);

export default router;