import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../tenant/middleware/tenant.middleware.js';
import { requirePermission } from '../rbac/middleware/rbac.middleware.js';
import {
  updateProfileSchema,
  userParamsSchema,
  listUsersQuerySchema,
  updateUserSchema,
  sessionParamsSchema,
} from './user.schema.js';
import {
  getMyProfileController,
  updateMyProfileController,
  listUsersController,
  getUserDetailController,
  updateUserByAdminController,
  deleteUserController,
  reactivateUserController,
  getMySessionsController,
  revokeMySessionController,
} from './user.controller.js';

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);

// ── Self-service (no tenant required) ──
router.get('/me', getMyProfileController);
router.patch('/me', validate(updateProfileSchema), updateMyProfileController);
router.get('/me/sessions', getMySessionsController);
router.delete('/sessions/:sessionId', validate(sessionParamsSchema), revokeMySessionController);

// ── Tenant-scoped (requires x-tenant-id + membership) ──
router.use(requireTenant);

router.get('/', validate(listUsersQuerySchema), listUsersController);
router.get('/:id', validate(userParamsSchema), getUserDetailController);

// ── Permission-gated admin routes ──
router.patch('/:id', requirePermission('user', 'update'), validate(updateUserSchema), updateUserByAdminController);
router.delete('/:id', requirePermission('user', 'delete'), validate(userParamsSchema), deleteUserController);
router.post('/:id/reactivate', requirePermission('user', 'update'), validate(userParamsSchema), reactivateUserController);

export default router;
