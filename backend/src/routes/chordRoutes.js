// routes/chordRoutes.js
import express from 'express';
import { ChordController } from '../controllers/chordController.js';
import { getBySelectorParamsSchema, createChordBodySchema, patchChordBodySchema, idParamSchema } from '../schemas/chordSchema.js';
import { validate } from '../middlewares/validation.js';
import { authenticate, requireActiveToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Public routes
router.get('/user-chords', authenticate, requireActiveToken, ChordController.getUserChords);
router.get('/', ChordController.getAll);
router.get('/:id', validate({ params: idParamSchema}), ChordController.getById);
router.get('/:selector/:selectorValue/tuning/:tuningValue', validate({ params: getBySelectorParamsSchema }), ChordController.getBySelector);

// Protected routes
router.post('/', authenticate, requireActiveToken, validate({ body: createChordBodySchema }), ChordController.create);
router.patch('/:id', authenticate, requireActiveToken, requireAdmin, validate({ params: idParamSchema, body: patchChordBodySchema }), ChordController.patch);
router.delete('/:id', authenticate, requireActiveToken, validate({ params: idParamSchema }), ChordController.remove);

export default router;