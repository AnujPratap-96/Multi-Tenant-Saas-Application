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
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
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
 * Delete Task
 */
export const deleteTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await taskService.deleteTask(id, req.tenantId, req.userId, req);
  return successResponse(res, {
    message: "Task deleted successfully",
    data: result,
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
  const { comment, parentId, mentionIds } = req.body;
  const newComment = await taskService.addComment(
    id,
    req.tenantId,
    { comment, parentId, mentionIds },
    req.userId,
    req
  );
  return successResponse(res, {
    statusCode: 201,
    message: "Comment added successfully",
    data: newComment,
  });
});

/**
 * Edit Comment
 */
export const updateCommentController = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  const { comment } = req.body;
  const updated = await taskService.updateComment(
    id,
    commentId,
    req.tenantId,
    req.userId,
    comment,
    req
  );
  return successResponse(res, {
    message: "Comment updated successfully",
    data: updated,
  });
});

/**
 * Remove Assignee
 */
export const removeAssigneeController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId: targetUserId, reason } = req.body;
  const result = await taskService.removeAssignee(
    id,
    req.tenantId,
    targetUserId,
    req.userId,
    reason,
    req
  );
  return successResponse(res, {
    message: "Assignee removed successfully",
    data: result,
  });
});

/**
 * Get Task Activity Timeline
 */
export const getTaskActivityController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const options = {
    page: req.query.page ? parseInt(req.query.page) : 1,
    limit: req.query.limit ? parseInt(req.query.limit) : 30,
  };
  const result = await taskService.getTaskActivity(id, req.tenantId, req.userId, options);
  return successResponse(res, {
    message: "Task activity retrieved successfully",
    data: result,
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

/**
 * Delete Comment (soft delete)
 */
export const deleteCommentController = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  const result = await taskService.deleteComment(id, commentId, req.tenantId, req.userId, req);
  return successResponse(res, {
    message: "Comment deleted successfully",
    data: result,
  });
});

/**
 * List tasks assigned to the current user (across visible departments/projects)
 */
export const listMyTasksController = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page ? parseInt(req.query.page) : 1,
    limit: req.query.limit ? parseInt(req.query.limit) : 20,
    status: req.query.status,
    priority: req.query.priority,
    search: req.query.search,
  };
  const result = await taskService.listMyTasks(req.tenantId, req.userId, options);
  return successResponse(res, {
    message: "My tasks retrieved successfully",
    data: result,
  });
});
