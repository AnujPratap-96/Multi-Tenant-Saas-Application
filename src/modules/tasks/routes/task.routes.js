// Task routes - API endpoints for task operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import { requirePermission } from '../../rbac/middleware/rbac.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  taskParamsSchema,
  addAssigneeSchema,
  createCommentSchema,
  commentParamsSchema,
} from '../schemas/task.schema.js';
import {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
  deleteTaskController,
  addAssigneeController,
  addCommentController,
  getCommentsController,
  deleteCommentController,
} from '../controllers/task.controller.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// Task CRUD
router.post('/', requirePermission('task', 'create'), validate(createTaskSchema), createTaskController);
router.get('/', validate(listTasksSchema), listTasksController);
router.get('/:id', validate(taskParamsSchema), getTaskController);
router.patch('/:id', requirePermission('task', 'update'), validate(taskParamsSchema), validate(updateTaskSchema), updateTaskController);
router.delete('/:id', requirePermission('task', 'delete'), validate(taskParamsSchema), deleteTaskController);

// Assignees
router.post('/:id/assignees', requirePermission('task', 'update'), validate(taskParamsSchema), validate(addAssigneeSchema), addAssigneeController);

// Comments
/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComment'
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/:id/comments', requirePermission('task', 'update'), validate(taskParamsSchema), validate(createCommentSchema), addCommentController);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   get:
 *     summary: List comments for a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Comments (soft-deleted ones excluded)
 */
router.get('/:id/comments', validate(taskParamsSchema), getCommentsController);

/**
 * @swagger
 * /tasks/{id}/comments/{commentId}:
 *   delete:
 *     summary: Soft-delete a comment (B-23)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/:id/comments/:commentId', requirePermission('task', 'update'), validate(commentParamsSchema), deleteCommentController);

export default router;
