import express from 'express';
import { authenticate, requireActiveToken } from '../middlewares/authentication.js';
import { authorizeRole, authorizeSelfOrAdminFlexible } from '../middlewares/authorization.js';
import UserController from '../controllers/userController.js';
import { ensureEmailUnique, ensureEmailUniqueFlexible, ensureTargetUserExists, forbidNonAdminFields, hashPasswordIfPresent, requireNonEmptyUpdates, validateBody, validateEmailParam } from '../middlewares/validation.js';
import { userSchema } from '../schemas/userSchema.js';

const router = express.Router();

router.get('/', authenticate, requireActiveToken, authorizeRole('admin'), UserController.getAll);
router.get('/:selector/:value', authenticate, requireActiveToken, authorizeSelfOrAdminFlexible('selector', 'value'), UserController.getUserBySelector);
router.post('/', authenticate, requireActiveToken, authorizeRole('admin'), hashPasswordIfPresent, validateBody(userSchema), UserController.create); 
//router.put('/:id', authenticate, requireActiveToken, authorizeRole('admin'), validateBody(UserSchema), ensureEmailUnique('id'), ensureTargetUserExists('id'), hashPasswordIfPresent, requireNonEmptyUpdates, UserController.update);
//router.patch('/:id', authenticate, requireActiveToken, authorizeSelfOrAdmin(), /*validateBody(patchSchema),*/ ensureEmailUnique('id'), ensureTargetUserExists('id'), hashPasswordIfPresent, UserController.patch);
router.delete('/:id', authenticate, requireActiveToken, authorizeRole('admin'), UserController.remove);

export default router;