// Task controller - HTTP handling for task operations
import * as taskService from "../services/task.service.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

/**
 * Create Task
 */
export const createTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.tenantId, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Task created successfully",
    data: task,
  });
});

/**
 * Get Task Details
 */
export const getTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await taskService.getTask(id, req.tenantId, req.userId);
  return successResponse(res, {
    message: "Task retrieved successfully",
    data: task,
  });
});

/**
 * List Tasks by Project
 */
export const listTasksController = asyncHandler(async (req, res) => {
  const { projectId, page, limit, status, priority, search } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    priority,
    search,
  };
  const result = await taskService.listTasks(projectId, req.tenantId, options, req.userId);
  return successResponse(res, {
    message: "Tasks retrieved successfully",
    data: result,
  });
});

/**
 * Update Task
 */
export const updateTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await taskService.updateTask(id, req.tenantId, req.body, req.userId, req);
  return successResponse(res, {
    message: "Task updated successfully",
    data: task,
  });
});

/**
 * Add Assignee
 */
export const addAssigneeController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: targetUserId } = req.body;
  const assignee = await taskService.addAssignee(id, req.tenantId, targetUserId, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Assignee added successfully",
    data: assignee,
  });
});

/**
 * Add Comment
 */
export const addCommentController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const newComment = await taskService.addComment(id, req.tenantId, comment, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Comment added successfully",
    data: newComment,
  });
});

/**
 * Get Comments
 */
export const getCommentsController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await taskService.getComments(id, req.tenantId, req.userId);
  return successResponse(res, {
    message: "Comments retrieved successfully",
    data: comments,
  });
});
