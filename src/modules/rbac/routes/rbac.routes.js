// RBAC routes - API endpoints for permissions
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant, requireTenantAdmin } from '../../tenant/middleware/tenant.middleware.js';
import { assignUserPermissionSchema } from '../schemas/rbac.schema.js';
import {
  getMyPermissionsController,
  assignUserPermissionController,
} from '../controllers/rbac.controller.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// View current user's permissions
router.get('/my', getMyPermissionsController);

// Manage user specific permissions (Admin only)
router.post('/assign', requireTenantAdmin, validate(assignUserPermissionSchema), assignUserPermissionController);

export default router;
