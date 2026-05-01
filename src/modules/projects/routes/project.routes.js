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
} from '../schemas/project.schema.js';
import {
  createProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
  deleteProjectController,
  addMemberController,
  removeMemberController,
} from '../controllers/project.controller.js';

const router = Router();

// All routes require authentication and tenant context
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
router.post('/:id/members', validate(projectParamsSchema), validate(addMemberSchema), addMemberController);
router.delete('/:id/members/:userId', validate(projectParamsSchema), removeMemberController);

export default router;
