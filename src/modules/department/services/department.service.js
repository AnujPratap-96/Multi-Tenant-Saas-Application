// Department service - business logic for departments + task types
import { ApiError } from "../../../utils/api-error.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as departmentRepository from "../repositories/department.repository.js";
import * as departmentAuth from "./department-auth.service.js";
import { DEPARTMENT_AUDIT_ACTIONS, TASK_TYPE_AUDIT_ACTIONS } from "../constants/department.constants.js";
import prisma from "../../../lib/prisma.js";

const assertTenantMember = async (tenantId, userId) => {
  const m = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    select: { status: true },
  });
  if (!m || m.status !== "ACTIVE") throw new ApiError(403, "You are not an active member of this tenant");
};

// Only org admins create departments; the chosen manager must be a tenant member.
export const createDepartment = async ({ tenantId, userId, data, req }) => {
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId))) {
    throw new ApiError(403, "Only tenant admins can create departments");
  }
  await assertTenantMember(tenantId, data.managerId);
  const existing = await departmentRepository.findDepartmentByName(tenantId, data.name);
  if (existing) throw new ApiError(400, "A department with this name already exists");

  const department = await departmentRepository.createDepartment({
    tenantId,
    name: data.name,
    description: data.description,
    managerId: data.managerId,
    createdById: userId,
  });

  // Single home department per user
  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: data.managerId } },
    data: { homeDepartmentId: department.id },
  });

  await logAudit({
    action: DEPARTMENT_AUDIT_ACTIONS.CREATE,
    entityType: "DEPARTMENT",
    entityId: department.id,
    actorUserId: userId,
    tenantId,
    newValue: { name: data.name, managerId: data.managerId },
    req,
  });
  return department;
};

export const getDepartment = async ({ id, tenantId, userId }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  const isAdmin = await departmentAuth.isOrgAdmin(tenantId, userId);
  const manages = await departmentAuth.isDepartmentManager(tenantId, userId, id);
  const member = await departmentRepository.findDepartmentMember(id, userId);
  if (!isAdmin && !manages && !member) {
    throw new ApiError(403, "You do not have access to this department");
  }
  return department;
};

export const listDepartments = async ({ tenantId, userId, options }) => {
  const isAdmin = await departmentAuth.isOrgAdmin(tenantId, userId);
  if (isAdmin) return departmentRepository.listDepartments(tenantId, options);
  const managed = await departmentAuth.getUserManagedDepartmentIds(tenantId, userId);
  const memberDepts = await departmentRepository.getUserDepartmentIds(tenantId, userId);
  const visible = [...new Set([...managed, ...memberDepts])];
  if (!visible.length) return { departments: [], pagination: { total: 0, page: options.page, limit: options.limit, totalPages: 0 } };
  return departmentRepository.listDepartments(tenantId, { ...options, idFilter: visible });
};

export const updateDepartment = async ({ id, tenantId, userId, data, req }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId)) && !(await departmentAuth.isDepartmentManager(tenantId, userId, id))) {
    throw new ApiError(403, "Only admins or the department manager can update it");
  }
  if (data.managerId && data.managerId !== department.managerId) {
    await assertTenantMember(tenantId, data.managerId);
    await departmentRepository.addDepartmentMember(id, data.managerId, "MANAGER");
    await prisma.tenantUser.update({
      where: { tenantId_userId: { tenantId, userId: data.managerId } },
      data: { homeDepartmentId: id },
    });
  }
  if (data.name && data.name !== department.name) {
    const dup = await departmentRepository.findDepartmentByName(tenantId, data.name);
    if (dup) throw new ApiError(400, "A department with this name already exists");
  }
  const updated = await departmentRepository.updateDepartment(id, {
    name: data.name,
    description: data.description,
    managerId: data.managerId,
  });
  await logAudit({
    action: DEPARTMENT_AUDIT_ACTIONS.UPDATE,
    entityType: "DEPARTMENT",
    entityId: id,
    actorUserId: userId,
    tenantId,
    oldValue: { name: department.name },
    newValue: data,
    req,
  });
  return updated;
};

export const deleteDepartment = async ({ id, tenantId, userId, req }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId))) {
    throw new ApiError(403, "Only admins can delete departments");
  }
  await departmentRepository.softDeleteDepartment(id);
  await logAudit({
    action: DEPARTMENT_AUDIT_ACTIONS.DELETE,
    entityType: "DEPARTMENT",
    entityId: id,
    actorUserId: userId,
    tenantId,
    req,
  });
  return { success: true };
};

export const addMember = async ({ id, tenantId, userId, data, req }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId)) && !(await departmentAuth.isDepartmentManager(tenantId, userId, id))) {
    throw new ApiError(403, "Only admins or the department manager can add members");
  }
  await assertTenantMember(tenantId, data.userId);
  const member = await departmentRepository.addDepartmentMember(id, data.userId, data.role);
  // Single home department per user
  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: data.userId } },
    data: { homeDepartmentId: id },
  });
  await logAudit({
    action: DEPARTMENT_AUDIT_ACTIONS.ADD_MEMBER,
    entityType: "DEPARTMENT",
    entityId: id,
    actorUserId: userId,
    subjectUserId: data.userId,
    tenantId,
    newValue: { role: data.role },
    req,
  });
  return member;
};

export const listMembers = async ({ id, tenantId, userId, options }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  const isAdmin = await departmentAuth.isOrgAdmin(tenantId, userId);
  const manages = await departmentAuth.isDepartmentManager(tenantId, userId, id);
  const member = await departmentRepository.findDepartmentMember(id, userId);
  if (!isAdmin && !manages && !member) {
    throw new ApiError(403, "You do not have access to this department");
  }
  return departmentRepository.listDepartmentMembers(id, options);
};

export const removeMember = async ({ id, tenantId, userId, targetUserId, req }) => {
  const department = await departmentRepository.findDepartmentById(id, tenantId);
  if (!department) throw new ApiError(404, "Department not found");
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId)) && !(await departmentAuth.isDepartmentManager(tenantId, userId, id))) {
    throw new ApiError(403, "Only admins or the department manager can remove members");
  }
  if (department.managerId === targetUserId) {
    throw new ApiError(400, "Cannot remove the department manager");
  }
  const member = await departmentRepository.findDepartmentMember(id, targetUserId);
  if (!member) throw new ApiError(404, "Member not found in department");
  await departmentRepository.removeDepartmentMember(id, targetUserId);
  await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId: targetUserId } },
    data: { homeDepartmentId: null },
  });
  await logAudit({
    action: DEPARTMENT_AUDIT_ACTIONS.REMOVE_MEMBER,
    entityType: "DEPARTMENT",
    entityId: id,
    actorUserId: userId,
    subjectUserId: targetUserId,
    tenantId,
    req,
  });
  return { success: true };
};

// ----- Task types -----
export const createTaskType = async ({ tenantId, userId, data, req }) => {
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId))) {
    throw new ApiError(403, "Only tenant admins can manage task types");
  }
  if (data.departmentId) {
    const dept = await departmentRepository.findDepartmentById(data.departmentId, tenantId);
    if (!dept) throw new ApiError(400, "Invalid departmentId");
  }
  const created = await departmentRepository.createTaskType({ ...data, tenantId });
  await logAudit({
    action: TASK_TYPE_AUDIT_ACTIONS.CREATE,
    entityType: "TASK_TYPE",
    entityId: created.id,
    actorUserId: userId,
    tenantId,
    newValue: data,
    req,
  });
  return created;
};

export const listTaskTypes = async ({ tenantId }) => departmentRepository.listTaskTypes(tenantId);

export const updateTaskType = async ({ id, tenantId, userId, data, req }) => {
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId))) {
    throw new ApiError(403, "Only tenant admins can manage task types");
  }
  const tt = await departmentRepository.findTaskTypeById(id, tenantId);
  if (!tt) throw new ApiError(404, "Task type not found");
  const updated = await departmentRepository.updateTaskType(id, data);
  await logAudit({
    action: TASK_TYPE_AUDIT_ACTIONS.UPDATE,
    entityType: "TASK_TYPE",
    entityId: id,
    actorUserId: userId,
    tenantId,
    newValue: data,
    req,
  });
  return updated;
};

export const deleteTaskType = async ({ id, tenantId, userId, req }) => {
  if (!(await departmentAuth.isOrgAdmin(tenantId, userId))) {
    throw new ApiError(403, "Only tenant admins can manage task types");
  }
  const tt = await departmentRepository.findTaskTypeById(id, tenantId);
  if (!tt) throw new ApiError(404, "Task type not found");
  await departmentRepository.deleteTaskType(id);
  await logAudit({
    action: TASK_TYPE_AUDIT_ACTIONS.DELETE,
    entityType: "TASK_TYPE",
    entityId: id,
    actorUserId: userId,
    tenantId,
    req,
  });
  return { success: true };
};
