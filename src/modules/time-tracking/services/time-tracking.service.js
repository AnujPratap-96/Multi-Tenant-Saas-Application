import { ApiError } from "../../../utils/api-error.js";
import * as timeEntryRepo from "../repositories/time-entry.repository.js";
import * as taskRepo from "../../tasks/repositories/task.repository.js";
import {
  isOrgAdmin,
  getUserManagedDepartmentIds,
  canViewTask,
} from "../../department/services/department-auth.service.js";

const assertCanViewTask = async (userId, tenantId, taskId) => {
  const task = await taskRepo.findTaskById(taskId, tenantId);
  if (!task) throw new ApiError(404, "Task not found");
  const ctx = { userId, tenantId };
  if (!canViewTask(ctx, task)) {
    throw new ApiError(403, "You are not allowed to access this task");
  }
  return task;
};

const assertCanModifyEntry = async (userId, tenantId, entry) => {
  if (entry.userId === userId) return;
  if (await isOrgAdmin(tenantId, userId)) return;
  const task = entry.task;
  const deptIds = (task?.departments || []).map((d) => d.departmentId);
  const managed = await getUserManagedDepartmentIds(tenantId, userId);
  const canManage = deptIds.some((id) => managed.includes(id));
  if (!canManage) {
    throw new ApiError(403, "You are not allowed to modify this time entry");
  }
};

export const createTimeEntry = async ({ userId, tenantId, taskId, validated }) => {
  await assertCanViewTask(userId, tenantId, taskId);
  return timeEntryRepo.createTimeEntry({
    tenantId,
    userId,
    taskId,
    startedAt: validated.startedAt,
    endedAt: validated.endedAt,
    description: validated.description,
  });
};

export const stopTimeEntry = async ({ userId, tenantId, entryId }) => {
  const entry = await timeEntryRepo.findTimeEntryById(entryId, tenantId);
  if (!entry) throw new ApiError(404, "Time entry not found");
  await assertCanModifyEntry(userId, tenantId, entry);
  const updated = await timeEntryRepo.stopTimeEntry(entryId, tenantId, userId);
  if (!updated) throw new ApiError(404, "Time entry not found");
  return updated;
};

export const updateTimeEntry = async ({ userId, tenantId, entryId, validated }) => {
  const entry = await timeEntryRepo.findTimeEntryById(entryId, tenantId);
  if (!entry) throw new ApiError(404, "Time entry not found");
  await assertCanModifyEntry(userId, tenantId, entry);
  const updated = await timeEntryRepo.updateTimeEntry(entryId, tenantId, {
    startedAt: validated.startedAt,
    endedAt: validated.endedAt,
    description: validated.description,
  });
  if (!updated) throw new ApiError(404, "Time entry not found");
  return updated;
};

export const deleteTimeEntry = async ({ userId, tenantId, entryId }) => {
  const entry = await timeEntryRepo.findTimeEntryById(entryId, tenantId);
  if (!entry) throw new ApiError(404, "Time entry not found");
  await assertCanModifyEntry(userId, tenantId, entry);
  await timeEntryRepo.softDeleteTimeEntry(entryId, tenantId);
  return { id: entryId, deleted: true };
};

export const listTaskTimeEntries = async ({ userId, tenantId, taskId, validated }) => {
  await assertCanViewTask(userId, tenantId, taskId);
  return timeEntryRepo.listTaskTimeEntries(taskId, tenantId, validated);
};

export const listMyTimeEntries = async ({ userId, tenantId, validated }) => {
  return timeEntryRepo.listUserTimeEntries(userId, tenantId, validated);
};
