// Task service - Business logic for task operations
import { ApiError } from "../../../utils/api-error.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as taskRepository from "../repositories/task.repository.js";
import * as projectRepository from "../../projects/repositories/project.repository.js";
import * as taskRedis from "../redis/task.redis.js";
import { TASK_AUDIT_ACTIONS, TASK_STATUS } from "../constants/task.constants.js";

/**
 * Ensure user has access to project
 */
const checkProjectAccess = async (projectId, userId) => {
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership) {
    throw new ApiError(403, "You do not have access to this project");
  }
  return membership;
};

/**
 * Create Task
 */
export const createTask = async (data, tenantId, userId, req) => {
  const { projectId } = data;
  await checkProjectAccess(projectId, userId);

  const task = await taskRepository.createTask({
    ...data,
    tenantId,
    createdById: userId,
  });

  await taskRedis.invalidateProjectTasksCache(projectId);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.CREATE,
    entityType: 'TASK',
    entityId: task.id,
    actorUserId: userId,
    tenantId,
    newValue: data,
    req,
  });

  return task;
};

/**
 * Get Task Details
 */
export const getTask = async (taskId, tenantId, userId) => {
  const cachedTask = await taskRedis.getCachedTask(taskId);
  let task = cachedTask;

  if (!task) {
    task = await taskRepository.findTaskById(taskId, tenantId);
    if (!task) throw new ApiError(404, "Task not found");
    await taskRedis.setCachedTask(taskId, task);
  }

  await checkProjectAccess(task.projectId, userId);
  return task;
};

/**
 * List Tasks
 */
export const listTasks = async (projectId, tenantId, options, userId) => {
  await checkProjectAccess(projectId, userId);

  const cachedList = await taskRedis.getCachedTaskList(projectId, options);
  if (cachedList) return cachedList;

  const result = await taskRepository.listTasksByProject(projectId, tenantId, options);
  await taskRedis.setCachedTaskList(projectId, options, result);
  return result;
};

/**
 * Update Task
 */
export const updateTask = async (taskId, tenantId, data, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");

  await checkProjectAccess(task.projectId, userId);

  const updateData = { ...data, updatedById: userId };
  if (data.status === TASK_STATUS.DONE && task.status !== TASK_STATUS.DONE) {
    updateData.completedAt = new Date();
  }

  const updatedTask = await taskRepository.updateTask(taskId, updateData);
  await taskRedis.invalidateTaskCache(taskId, task.projectId);

  await logAudit({
    action: data.status && data.status !== task.status ? TASK_AUDIT_ACTIONS.STATUS_CHANGE : TASK_AUDIT_ACTIONS.UPDATE,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    oldValue: { status: task.status, title: task.title },
    newValue: data,
    req,
  });

  return updatedTask;
};

/**
 * Assignee Operations
 */
export const addAssignee = async (taskId, tenantId, targetUserId, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  await checkProjectAccess(task.projectId, userId);

  // Ensure target user is also in the project
  await checkProjectAccess(task.projectId, targetUserId);

  const assignee = await taskRepository.addAssignee(taskId, targetUserId);
  await taskRedis.invalidateTaskCache(taskId, task.projectId);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.ASSIGNEE_ADD,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    newValue: { userId: targetUserId },
    req,
  });

  return assignee;
};

/**
 * Comment Operations
 */
export const addComment = async (taskId, tenantId, comment, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  await checkProjectAccess(task.projectId, userId);

  const newComment = await taskRepository.createComment({
    taskId,
    userId,
    comment,
  });

  await logAudit({
    action: TASK_AUDIT_ACTIONS.COMMENT_ADD,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    newValue: { commentId: newComment.id },
    req,
  });

  return newComment;
};

export const getComments = async (taskId, tenantId, userId) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  await checkProjectAccess(task.projectId, userId);

  return await taskRepository.listComments(taskId);
};
