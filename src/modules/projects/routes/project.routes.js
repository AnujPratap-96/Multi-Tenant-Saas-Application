// Project routes - API endpoints for project operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import { requirePermission } from '../../rbac/middleware/rbac.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  listProjectsSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../schemas/project.schema.js';
import {
  createProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
  deleteProjectController,
  addMemberController,
  removeMemberController,
  updateMemberRoleController,
  getProjectDashboardController,
} from '../controllers/project.controller.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// Project CRUD
router.post('/', requirePermission('project', 'create'), validate(createProjectSchema), createProjectController);
router.get('/', validate(listProjectsSchema), listProjectsController);
router.get('/:id', validate(projectParamsSchema), getProjectController);
router.patch('/:id', requirePermission('project', 'update'), validate(projectParamsSchema), validate(updateProjectSchema), updateProjectController);
router.delete('/:id', requirePermission('project', 'delete'), validate(projectParamsSchema), deleteProjectController);

// Project Member Management
router.post('/:id/members', requirePermission('project', 'update'), validate(projectParamsSchema), validate(addMemberSchema), addMemberController);
router.patch('/:id/members/:userId', requirePermission('project', 'update'), validate(updateMemberRoleSchema), updateMemberRoleController);
router.delete('/:id/members/:userId', requirePermission('project', 'update'), validate(projectParamsSchema), removeMemberController);

// Project Dashboard
router.get('/:id/dashboard', validate(projectParamsSchema), getProjectDashboardController);

export default router;
