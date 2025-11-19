// routes/chordRoutes.js
import express from 'express';
import { ChordController } from '../controllers/chordController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', ChordController.getAll);
router.get('/:id', ChordController.getById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, ChordController.create);
router.put('/:id', authenticate, isAdmin, ChordController.update);
router.patch('/:id', authenticate, isAdmin, ChordController.patch);
router.delete('/:id', authenticate, isAdmin, ChordController.remove);

export default router;