import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  assignUserPermissionSchema,
  updateUserRoleSchema,
} from '../schemas/rbac.schema.js';
import {
  getMyPermissionsController,
  assignUserPermissionController,
  listPermissionsController,
  listRolesController,
  getRoleController,
  listTenantUsersController,
  updateUserRoleController,
} from '../controllers/rbac.controller.js';

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

router.get('/permissions', requirePermission('rbac', 'view'), listPermissionsController);
router.get('/my', getMyPermissionsController);

// D-13: roles are read-only — custom-role CRUD is explicitly out of scope for v2
router.get('/roles', requirePermission('rbac', 'view'), listRolesController);
router.get('/roles/:id', requirePermission('rbac', 'view'), getRoleController);

router.post('/assign', requirePermission('rbac', 'manage'), validate(assignUserPermissionSchema), assignUserPermissionController);

router.get('/users', requirePermission('rbac', 'view'), listTenantUsersController);

/**
 * @swagger
 * /rbac/users/{userId}/role:
 *   patch:
 *     summary: Update a tenant user's role (D-13/S-24)
 *     description: Role must be one of ADMIN, MANAGER, USER. Custom roles are read-only and out of scope.
 *     tags: [RBAC]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdate'
 *     responses:
 *       200:
 *         description: Role updated (membership cache invalidated)
 */
router.patch('/users/:userId/role', requirePermission('rbac', 'manage'), validate(updateUserRoleSchema), updateUserRoleController);

export default router;
