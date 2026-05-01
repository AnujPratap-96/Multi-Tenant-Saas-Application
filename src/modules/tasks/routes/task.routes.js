// Task routes - API endpoints for task operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  addAssigneeSchema,
  createCommentSchema,
} from '../schemas/task.schema.js';
import {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
  addAssigneeController,
  addCommentController,
  getCommentsController,
} from '../controllers/task.controller.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// Task CRUD
router.post('/', validate(createTaskSchema), createTaskController);
router.get('/', validate(listTasksSchema), listTasksController);
router.get('/:id', getTaskController);
router.patch('/:id', validate(updateTaskSchema), updateTaskController);

// Assignees
router.post('/:id/assignees', validate(addAssigneeSchema), addAssigneeController);

// Comments
router.post('/:id/comments', validate(createCommentSchema), addCommentController);
router.get('/:id/comments', getCommentsController);

export default router;
