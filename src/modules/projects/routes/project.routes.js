// Project routes - API endpoints for project operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
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
  listMembersController,
} from '../controllers/project.controller.js';

const router = Router();

// All routes require authentication and tenant context.
// Authorization is enforced in the service layer (department-aware): admins, department managers,
// and project members — NOT via the generic org RBAC guard, which conflicts with department scoping.
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// Project CRUD
router.post('/', validate(createProjectSchema), createProjectController);
router.get('/', validate(listProjectsSchema), listProjectsController);
router.get('/:id', validate(projectParamsSchema), getProjectController);
router.patch('/:id', validate(projectParamsSchema), validate(updateProjectSchema), updateProjectController);
router.delete('/:id', validate(projectParamsSchema), deleteProjectController);

// Project Member Management
router.get('/:id/members', validate(projectParamsSchema), listMembersController);
router.post('/:id/members', validate(projectParamsSchema), validate(addMemberSchema), addMemberController);
router.patch('/:id/members/:userId', validate(updateMemberRoleSchema), updateMemberRoleController);
router.delete('/:id/members/:userId', validate(projectParamsSchema), removeMemberController);

// Project Dashboard
router.get('/:id/dashboard', validate(projectParamsSchema), getProjectDashboardController);

export default router;
