// routes/chordRoutes.js
import express from 'express';
import { ChordController } from '../controllers/chordController.js';
import { validateCreateChord } from '../middlewares/validation.js';
import { authenticate } from '../middlewares/authentication.js';
import { authorizeSelfOrAdminFlexible } from '../middlewares/authorization.js';

const router = express.Router();

// Public routes
router.get('/', ChordController.getAll);
router.get('/:id', ChordController.getById);
router.get('/:selector/:selectorValue/tuning/:tuningValue', ChordController.getBySelector);

// Protected routes (admin only)
router.post('/', authenticate, authorizeSelfOrAdminFlexible, validateCreateChord, ChordController.create);
router.put('/:id', authenticate, authorizeSelfOrAdminFlexible, ChordController.update);
router.patch('/:id', authenticate, authorizeSelfOrAdminFlexible, ChordController.patch);
router.delete('/:id', authenticate, authorizeSelfOrAdminFlexible, ChordController.remove);

export default router;