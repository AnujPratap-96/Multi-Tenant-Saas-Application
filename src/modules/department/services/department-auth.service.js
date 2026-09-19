// Department-aware authorization helpers (visibility + eligibility)
// Centralizes the rules from audit §J so project/task/department services stay consistent.
import prisma from "../../../lib/prisma.js";
import * as departmentRepository from "../repositories/department.repository.js";

export const isOrgAdmin = async (tenantId, userId) => {
  const membership = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    select: { role: true, status: true },
  });
  return !!membership && membership.status === "ACTIVE" && membership.role === "ADMIN";
};

export const getUserManagedDepartmentIds = async (tenantId, userId) => {
  const [owned, leadRows] = await Promise.all([
    prisma.department.findMany({
      where: { tenantId, managerId: userId, deletedAt: null },
      select: { id: true },
    }),
    prisma.departmentMember.findMany({
      where: { userId, role: "MANAGER", removedAt: null, department: { tenantId, deletedAt: null } },
      select: { departmentId: true },
    }),
  ]);
  return [...new Set([...owned.map((d) => d.id), ...leadRows.map((r) => r.departmentId)])];
};

export const userManagesAnyOf = async (tenantId, userId, departmentIds = []) => {
  if (!departmentIds.length) return false;
  const managed = await getUserManagedDepartmentIds(tenantId, userId);
  return departmentIds.some((id) => managed.includes(id));
};

export const userIsMemberOfAny = async (tenantId, userId, departmentIds = []) => {
  if (!departmentIds.length) return false;
  const member = await prisma.departmentMember.findFirst({
    where: {
      userId,
      removedAt: null,
      departmentId: { in: departmentIds },
      department: { tenantId, deletedAt: null },
    },
    select: { departmentId: true },
  });
  return !!member;
};

// ----- Project -----
export const canCreateProject = async (tenantId, userId, departmentIds = []) => {
  if (await isOrgAdmin(tenantId, userId)) return true;
  return userManagesAnyOf(tenantId, userId, departmentIds);
};

export const canViewProject = async (tenantId, userId, project) => {
  if (await isOrgAdmin(tenantId, userId)) return true;
  if (project.members?.some((m) => m.userId === userId && !m.removedAt)) return true;
  const deptIds = (project.departments || []).map((d) => d.departmentId);
  if (await userManagesAnyOf(tenantId, userId, deptIds)) return true;
  return false;
};

// ----- Task -----
export const canCreateTask = async (tenantId, userId, departmentIds = []) => {
  if (await isOrgAdmin(tenantId, userId)) return true;
  return userIsMemberOfAny(tenantId, userId, departmentIds);
};

export const canViewTask = async (tenantId, userId, task, project = null) => {
  if (await isOrgAdmin(tenantId, userId)) return true;
  if (task.assignees?.some((a) => a.userId === userId && !a.removedAt)) return true;
  const deptIds = (task.departments || []).map((d) => d.departmentId);
  if (await userManagesAnyOf(tenantId, userId, deptIds)) return true;
  if (project && (await canViewProject(tenantId, userId, project))) return true;
  return false;
};

// Candidate eligibility for assignment: their home department must be in the task's departments
// (or they are already a member of the task's project).
export const isAssignableCandidate = async (tenantId, candidateUserId, taskDepartmentIds = [], projectId = null) => {
  const member = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: candidateUserId } },
    select: { homeDepartmentId: true },
  });
  if (!member) return false;
  if (member.homeDepartmentId && taskDepartmentIds.includes(member.homeDepartmentId)) return true;
  if (projectId) {
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: candidateUserId } },
      select: { userId: true },
    });
    if (pm) return true;
  }
  return false;
};
