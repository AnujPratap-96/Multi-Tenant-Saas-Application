// Task routes - API endpoints for task operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  taskParamsSchema,
  addAssigneeSchema,
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
  removeAssigneeSchema,
  taskActivitySchema,
} from '../schemas/task.schema.js';
import {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
  deleteTaskController,
  addAssigneeController,
  addCommentController,
  updateCommentController,
  removeAssigneeController,
  getCommentsController,
  deleteCommentController,
  getTaskActivityController,
  listMyTasksController,
} from '../controllers/task.controller.js';

const router = Router();

// All routes require authentication and tenant context.
// Authorization is enforced in the service layer (department-aware): admins, department managers,
// project members, and assignees — NOT via the generic org RBAC guard.
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// My tasks (assigned to current user)
router.get('/my', listMyTasksController);

// Task CRUD
router.post('/', validate(createTaskSchema), createTaskController);
router.get('/', validate(listTasksSchema), listTasksController);
router.get('/:id', validate(taskParamsSchema), getTaskController);
router.patch('/:id', validate(taskParamsSchema), validate(updateTaskSchema), updateTaskController);
router.delete('/:id', validate(taskParamsSchema), deleteTaskController);

// Assignees
router.post('/:id/assignees', validate(taskParamsSchema), validate(addAssigneeSchema), addAssigneeController);
router.delete('/:id/assignees', validate(removeAssigneeSchema), removeAssigneeController);

// Task activity timeline
router.get('/:id/activity', validate(taskActivitySchema), getTaskActivityController);

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
router.post('/:id/comments', validate(taskParamsSchema), validate(createCommentSchema), addCommentController);

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
 *   patch:
 *     summary: Edit a comment (author only)
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
 *         description: Comment updated
 */
router.patch('/:id/comments/:commentId', validate(updateCommentSchema), updateCommentController);

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
router.delete('/:id/comments/:commentId', validate(commentParamsSchema), deleteCommentController);

export default router;
