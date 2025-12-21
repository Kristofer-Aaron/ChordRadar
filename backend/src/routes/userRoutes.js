import express from 'express';
import { authenticate, requireActiveToken } from '../middlewares/authentication.js';
import { authorizeRole, authorizeSelfOrAdmin } from '../middlewares/authorization.js';
import UserController from '../controllers/userController.js';
import { ensureEmailUnique, ensureTargetUserExists, forbidNonAdminFields, hashPasswordIfPresent, requireNonEmptyUpdates, validateBody, validateEmailParam } from '../middlewares/validation.js';
import { userSchema, patchSchema } from '../schemas/userSchema.js';
import { normalizePatchFields } from '../middlewares/transport.js';

const router = express.Router();

router.get('/', authenticate, requireActiveToken, authorizeRole('admin'), UserController.getAll);
router.get('/:id', authenticate, requireActiveToken, authorizeSelfOrAdmin('id'), UserController.getById);
router.get('/email/:email', authenticate, requireActiveToken, authorizeRole('admin'), validateEmailParam('email'), UserController.getByEmail);
router.post('/', authenticate, requireActiveToken, authorizeRole('admin'), validateBody(userSchema), hashPasswordIfPresent, UserController.create);
router.put('/:id', authenticate, requireActiveToken, authorizeSelfOrAdmin('id'), forbidNonAdminFields(['role', 'status', 'email_verified']), validateBody(userSchema), ensureEmailUnique('id'), ensureTargetUserExists('id'), hashPasswordIfPresent, requireNonEmptyUpdates, UserController.update);
router.patch('/:id', authenticate, requireActiveToken, authorizeSelfOrAdmin('id'), forbidNonAdminFields(['role', 'status', 'email_verified']), validateBody(patchSchema), ensureEmailUnique('id'), ensureTargetUserExists('id'), hashPasswordIfPresent, normalizePatchFields, requireNonEmptyUpdates, UserController.patch);
router.delete('/:id', authenticate, requireActiveToken, authorizeRole('admin'), UserController.remove);

export default router;