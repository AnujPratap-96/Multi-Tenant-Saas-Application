// Task service - Business logic for task operations
import { ApiError } from "../../../utils/api-error.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as taskRepository from "../repositories/task.repository.js";
import * as projectRepository from "../../projects/repositories/project.repository.js";
import * as taskRedis from "../redis/task.redis.js";
import * as departmentAuth from "../../department/services/department-auth.service.js";
import * as notificationService from "../../notifications/services/notification.service.js";
import prisma from "../../../lib/prisma.js";
import {
  TASK_AUDIT_ACTIONS,
  TASK_STATUS,
  isAllowedStatusTransition,
} from "../constants/task.constants.js";

/**
 * Notify a set of users (excluding the actor) about a task event.
 */
const notifyRecipients = async ({ tenantId, userIds, actorId, type, entityType, entityId, message, data }) => {
  const unique = [...new Set(userIds)].filter((id) => id && id !== actorId);
  await Promise.all(
    unique.map((userId) =>
      notificationService.notify({
        tenantId,
        userId,
        type,
        entityType,
        entityId,
        message,
        data,
      })
    )
  );
};


/**
 * Ensure user has access to project within the tenant context
 * A project membership is only meaningful inside the project's tenant.
 */
const checkProjectAccess = async (projectId, tenantId, userId) => {
  const project = await projectRepository.findProjectById(projectId, tenantId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
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
  const { projectId, departmentIds } = data;

  let project = null;
  let effectiveDeptIds = departmentIds || [];
  if (projectId) {
    project = await projectRepository.findProjectById(projectId, tenantId);
    if (!project) throw new ApiError(404, "Project not found");
    const projectDeptIds = (project.departments || []).map((d) => d.departmentId);
    effectiveDeptIds = projectDeptIds.length ? projectDeptIds : (departmentIds || []);
  } else if (!effectiveDeptIds || !effectiveDeptIds.length) {
    throw new ApiError(400, "departmentIds is required for standalone tasks");
  }

  // Validate every department belongs to this tenant (if any)
  if (effectiveDeptIds.length > 0) {
    const depts = await prisma.department.findMany({
      where: { id: { in: effectiveDeptIds }, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (depts.length !== effectiveDeptIds.length) {
      throw new ApiError(400, "One or more departments are invalid");
    }

    // Authorization: a department member (or admin) may create the task
    if (!(await departmentAuth.canCreateTask(tenantId, userId, effectiveDeptIds))) {
      throw new ApiError(403, "You can only create tasks in departments you belong to");
    }
  } else if (projectId) {
    if (!(await departmentAuth.canViewProject(tenantId, userId, project))) {
      throw new ApiError(403, "You do not have access to this project");
    }
  }

  const {
    title,
    description,
    priority,
    status,
    dueDate,
    taskTypeId,
    estimatedMinutes,
  } = data;

  const task = await taskRepository.createTask({
    title,
    description: description || null,
    priority: priority || "MEDIUM",
    status: status || "TODO",
    taskTypeId: taskTypeId || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    initialDueDate: dueDate ? new Date(dueDate) : null,
    estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
    projectId,
    tenantId,
    createdById: userId,
  });

  if (effectiveDeptIds.length > 0) {
    await taskRepository.createTaskDepartments(task.id, effectiveDeptIds);
  }

  await taskRepository.writeTaskActivity({
    tenantId,
    taskId: task.id,
    actorId: userId,
    type: "TASK_CREATED",
    toValue: data.status || TASK_STATUS.TODO,
  });

  if (projectId) await taskRedis.invalidateProjectTasksCache(tenantId, projectId);
  await taskRedis.invalidateTaskCache(task.id, projectId, tenantId);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.CREATE,
    entityType: 'TASK',
    entityId: task.id,
    actorUserId: userId,
    tenantId,
    newValue: { ...data, departmentIds: effectiveDeptIds },
    req,
  });

  return task;
};

/**
 * Get Task Details
 */
export const getTask = async (taskId, tenantId, userId) => {
  const cachedTask = await taskRedis.getCachedTask(taskId);
  let task = null;

  if (cachedTask && cachedTask.tenantId === tenantId) {
    task = cachedTask;
  }

  if (!task) {
    task = await taskRepository.findTaskById(taskId, tenantId);
    if (!task) throw new ApiError(404, "Task not found");
    await taskRedis.setCachedTask(taskId, task);
  }

  const visible = await departmentAuth.canViewTask(tenantId, userId, task, task.project);
  if (!visible) throw new ApiError(404, "Task not found");
  return task;
};

/**
 * List Tasks
 */
export const listTasks = async (projectId, tenantId, options, userId) => {
  await checkProjectAccess(projectId, tenantId, userId);

  const cachedList = await taskRedis.getCachedTaskList(tenantId, projectId, options);
  if (cachedList) return cachedList;

  const result = await taskRepository.listTasksByProject(projectId, tenantId, options);
  await taskRedis.setCachedTaskList(tenantId, projectId, options, result);
  return result;
};

/**
 * List tasks assigned to the current user across visible departments/projects
 */
export const listMyTasks = async (tenantId, userId, options) => {
  return await taskRepository.listMyTasks(tenantId, userId, options);
};

/**
 * Update Task
 */
export const updateTask = async (taskId, tenantId, data, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");

  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  const updateData = { ...data, updatedById: userId };
  const activities = [];
  const assigneeIds = (task.assignees || [])
    .filter((a) => !a.removedAt)
    .map((a) => a.userId);
  const recipientIds = [...assigneeIds, task.createdById].filter(Boolean);

  // --- Status change + lifecycle fields ---
  if (data.status && data.status !== task.status) {
    if (!isAllowedStatusTransition(task.status, data.status)) {
      throw new ApiError(400, `Cannot move task from ${task.status} to ${data.status}`);
    }
    const now = new Date();

    if (data.status === TASK_STATUS.IN_PROGRESS && !task.startedAt) {
      updateData.startedAt = now;
    }
    if (data.status === TASK_STATUS.DONE) {
      updateData.completedAt = now;
      updateData.reopenedAt = null;
    }
    if (data.status !== TASK_STATUS.DONE && task.status === TASK_STATUS.DONE) {
      updateData.completedAt = null;
      updateData.reopenedAt = now;
    }
    if (data.status === TASK_STATUS.BLOCKED) {
      updateData.blockedReason = data.blockedReason || task.blockedReason || null;
    }
    if (data.status === TASK_STATUS.CANCELLED) {
      updateData.cancelledReason = data.cancelledReason || task.cancelledReason || null;
    }

    activities.push({
      tenantId,
      taskId,
      actorId: userId,
      type: "STATUS_CHANGED",
      fromValue: task.status,
      toValue: data.status,
      reason: data.statusNote || null,
    });

    await notifyRecipients({
      tenantId,
      userIds: recipientIds,
      actorId: userId,
      type: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      entityId: taskId,
      message: `Task "${task.title}" moved to ${data.status}`,
      data: { status: data.status, from: task.status },
    });
  }

  // --- Due date change -> deadline history ---
  if (data.dueDate !== undefined && data.dueDate !== (task.dueDate?.toISOString?.() || null)) {
    const previous = task.dueDate;
    const next = data.dueDate ? new Date(data.dueDate) : null;
    updateData.dueDate = next;
    if (!task.initialDueDate) updateData.initialDueDate = previous;

    await taskRepository.writeDeadlineHistory({
      tenantId,
      taskId,
      previousDueDate: previous,
      newDueDate: next,
      changedById: userId,
      reason: data.dueDateNote || null,
    });
    activities.push({
      tenantId,
      taskId,
      actorId: userId,
      type: "DUE_DATE_CHANGED",
      fromValue: previous ? previous.toISOString() : null,
      toValue: next ? next.toISOString() : null,
      reason: data.dueDateNote || null,
    });

    await notifyRecipients({
      tenantId,
      userIds: recipientIds,
      actorId: userId,
      type: "TASK_DUE_DATE_CHANGED",
      entityType: "TASK",
      entityId: taskId,
      message: `Due date updated for "${task.title}"`,
      data: { previous: previous ? previous.toISOString() : null, next: next ? next.toISOString() : null },
    });
  }

  const updatedTask = await taskRepository.updateTask(taskId, updateData);
  await taskRedis.invalidateTaskCache(taskId, task.projectId, tenantId);

  await Promise.all(activities.map((a) => taskRepository.writeTaskActivity(a).catch(() => {})));

  const statusChanged = data.status && data.status !== task.status;
  await logAudit({
    action: statusChanged ? TASK_AUDIT_ACTIONS.STATUS_CHANGE : TASK_AUDIT_ACTIONS.UPDATE,
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
 * Delete Task (soft delete)
 */
export const deleteTask = async (taskId, tenantId, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");

  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  await taskRepository.softDeleteTask(taskId);
  await taskRedis.invalidateTaskCache(taskId, task.projectId, tenantId);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.DELETE,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    req,
  });

  return { success: true };
};

/**
 * Assignee Operations
 */
export const addAssignee = async (taskId, tenantId, targetUserId, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");

  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  // Eligibility: candidate must belong to one of the task's departments (or the project)
  const taskDeptIds = task.departments.map((d) => d.departmentId);
  const eligible = await departmentAuth.isAssignableCandidate(tenantId, targetUserId, taskDeptIds, task.projectId);
  if (!eligible) {
    throw new ApiError(400, "User must belong to one of the task's departments (or its project) to be assigned");
  }

  const assignee = await taskRepository.addAssignee(taskId, targetUserId, userId, null);
  await taskRedis.invalidateTaskCache(taskId, task.projectId, tenantId);

  await taskRepository.writeTaskActivity({
    tenantId,
    taskId,
    actorId: userId,
    type: "ASSIGNEE_ADDED",
    toValue: targetUserId,
  });

  await notificationService.notify({
    tenantId,
    userId: targetUserId,
    type: "TASK_ASSIGNED",
    entityType: "TASK",
    entityId: taskId,
    message: `You were assigned to "${task.title}"`,
    data: { taskId, assignedBy: userId },
  }).catch(() => {});

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
 * Remove an assignee from a task (with assignment history + notification)
 */
export const removeAssignee = async (taskId, tenantId, targetUserId, userId, reason, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");

  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  const existing = (task.assignees || []).find(
    (a) => a.userId === targetUserId && !a.removedAt
  );
  if (!existing) throw new ApiError(404, "Assignee not found on this task");

  const removed = await taskRepository.removeAssignee(taskId, targetUserId, reason || null);
  await taskRedis.invalidateTaskCache(taskId, task.projectId, tenantId);

  await taskRepository.writeTaskActivity({
    tenantId,
    taskId,
    actorId: userId,
    type: "ASSIGNEE_REMOVED",
    fromValue: targetUserId,
    reason: reason || null,
  });

  await logAudit({
    action: TASK_AUDIT_ACTIONS.ASSIGNEE_REMOVE,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    oldValue: { userId: targetUserId },
    req,
  });

  return removed;
};

/**
 * Comment Operations
 */
export const addComment = async (taskId, tenantId, { comment, parentId, mentionIds }, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  const newComment = await taskRepository.createComment({
    taskId,
    userId,
    comment,
    parentId: parentId || null,
  });

  if (mentionIds && mentionIds.length) {
    await taskRepository.createCommentMentions(newComment.id, mentionIds);
  }

  await taskRepository.writeTaskActivity({
    tenantId,
    taskId,
    actorId: userId,
    type: "COMMENT_ADDED",
    toValue: newComment.id,
  });

  // Notify mentioned users
  if (mentionIds && mentionIds.length) {
    await Promise.all(
      mentionIds
        .filter((id) => id !== userId)
        .map((id) =>
          notificationService.notify({
            tenantId,
            userId: id,
            type: "COMMENT_MENTION",
            entityType: "TASK",
            entityId: taskId,
            message: `You were mentioned on task "${task.title}"`,
            data: { taskId, commentId: newComment.id },
          }).catch(() => {})
        )
    );
  }

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

export const updateComment = async (taskId, commentId, tenantId, userId, commentText, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  const existing = await taskRepository.findCommentById(commentId);
  if (!existing || existing.taskId !== taskId) throw new ApiError(404, "Comment not found");

  // Only the author may edit their comment
  if (existing.userId !== userId) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  const updated = await taskRepository.updateComment(commentId, commentText);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.COMMENT_UPDATE || "TASK_COMMENT_UPDATE",
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    oldValue: { commentId },
    req,
  });

  return updated;
};

export const getComments = async (taskId, tenantId, userId) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  return await taskRepository.listComments(taskId);
};

export const getTaskActivity = async (taskId, tenantId, userId, options) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }
  return taskRepository.listTaskActivity(taskId, tenantId, options);
};

export const deleteComment = async (taskId, commentId, tenantId, userId, req) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  if (!(await departmentAuth.canViewTask(tenantId, userId, task, task.project))) {
    throw new ApiError(404, "Task not found");
  }

  const comment = await taskRepository.findCommentById(commentId);
  if (!comment || comment.taskId !== taskId) throw new ApiError(404, "Comment not found");

  // Author, department managers, or org admins may delete
  const isAuthor = comment.userId === userId;
  const isManagerOrAdmin =
    (await departmentAuth.isOrgAdmin(tenantId, userId)) ||
    (await departmentAuth.getUserManagedDepartmentIds(tenantId, userId)).some((id) =>
      (task.departments || []).map((d) => d.departmentId).includes(id)
    );
  if (!isAuthor && !isManagerOrAdmin) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  await taskRepository.deleteComment(commentId);
  await taskRedis.invalidateTaskCache(taskId, task.projectId, tenantId);

  await logAudit({
    action: TASK_AUDIT_ACTIONS.COMMENT_DELETE,
    entityType: 'TASK',
    entityId: taskId,
    actorUserId: userId,
    tenantId,
    oldValue: { commentId },
    req,
  });

  return { success: true };
};
