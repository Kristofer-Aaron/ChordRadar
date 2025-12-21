// routes/chordRoutes.js
import express from 'express';
import { ChordController } from '../controllers/chordController.js';
import { authenticate } from '../middlewares/authentication.js';
import { authorizeSelfOrAdmin } from '../middlewares/authorization.js';

const router = express.Router();

// Public routes
router.get('/', ChordController.getAll);
router.get('/:id', ChordController.getById);

// Protected routes (admin only)
router.post('/', authenticate, authorizeSelfOrAdmin, ChordController.create);
router.put('/:id', authenticate, authorizeSelfOrAdmin, ChordController.update);
router.patch('/:id', authenticate, authorizeSelfOrAdmin, ChordController.patch);
router.delete('/:id', authenticate, authorizeSelfOrAdmin, ChordController.remove);

export default router;