// Project service - Business logic for project operations
import { ApiError } from "../../../utils/api-error.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as projectRepository from "../repositories/project.repository.js";
import { PROJECT_AUDIT_ACTIONS, PROJECT_ROLES } from "../constants/project.constants.js";
import * as projectRedis from "../redis/project.redis.js";
import * as tenantMembershipRepository from "../../tenant/repositories/tenant-membership.repository.js";

/**
 * Create a new project
 */
export const createProject = async (data, tenantId, userId, req) => {
  const project = await projectRepository.createProjectWithOwner({
    ...data,
    tenantId,
    createdById: userId,
  });

  // Invalidate list cache
  await projectRedis.invalidateTenantProjectsCache(tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.CREATE,
    entityType: 'PROJECT',
    entityId: project.id,
    actorUserId: userId,
    tenantId,
    newValue: data,
    req,
  });

  return project;
};

/**
 * Get project by ID
 */
export const getProject = async (projectId, tenantId, userId) => {
  // Try to get from cache
  const cachedProject = await projectRedis.getCachedProject(projectId);
  let project = null;

  if (cachedProject && cachedProject.tenantId === tenantId) {
    project = cachedProject;
  }

  if (!project) {
    project = await projectRepository.findProjectById(projectId, tenantId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    // Save to cache
    await projectRedis.setCachedProject(projectId, project);
  }

  // Check if user is a member
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership) {
    throw new ApiError(403, "You are not a member of this project");
  }

  return {
    ...project,
    userRole: membership.role,
  };
};

/**
 * List projects
 */
export const listProjects = async (tenantId, options) => {
  // Try to get from cache
  const cachedList = await projectRedis.getCachedProjectList(tenantId, options);
  if (cachedList) return cachedList;

  const result = await projectRepository.listProjectsByTenant(tenantId, options);
  
  // Save to cache
  await projectRedis.setCachedProjectList(tenantId, options, result);
  
  return result;
};

/**
 * Update project
 */
export const updateProject = async (projectId, tenantId, data, userId, req) => {
  const existingProject = await projectRepository.findProjectById(projectId, tenantId);
  if (!existingProject) {
    throw new ApiError(404, "Project not found");
  }

  // Check permissions (Owner or Maintainer)
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership || (membership.role !== PROJECT_ROLES.OWNER && membership.role !== PROJECT_ROLES.MAINTAINER)) {
    throw new ApiError(403, "Insufficient permissions to update project");
  }

  const project = await projectRepository.updateProject(projectId, data);

  // Invalidate cache
  await projectRedis.invalidateProjectCache(projectId, tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.UPDATE,
    entityType: 'PROJECT',
    entityId: project.id,
    actorUserId: userId,
    tenantId,
    oldValue: { name: existingProject.name, description: existingProject.description },
    newValue: data,
    req,
  });

  return project;
};

/**
 * Delete project
 */
export const deleteProject = async (projectId, tenantId, userId, req) => {
  const existingProject = await projectRepository.findProjectById(projectId, tenantId);
  if (!existingProject) {
    throw new ApiError(404, "Project not found");
  }

  // Only Owner can delete
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership || membership.role !== PROJECT_ROLES.OWNER) {
    throw new ApiError(403, "Only the project owner can delete the project");
  }

  await projectRepository.softDeleteProject(projectId);

  // Invalidate cache
  await projectRedis.invalidateProjectCache(projectId, tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.DELETE,
    entityType: 'PROJECT',
    entityId: projectId,
    actorUserId: userId,
    tenantId,
    req,
  });

  return { success: true };
};

/**
 * Add member to project
 */
export const addMember = async (projectId, tenantId, memberData, userId, req) => {
  const { userId: targetUserId, role } = memberData;

  const project = await projectRepository.findProjectById(projectId, tenantId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check permissions
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership || (membership.role !== PROJECT_ROLES.OWNER && membership.role !== PROJECT_ROLES.MAINTAINER)) {
    throw new ApiError(403, "Insufficient permissions to add members");
  }

  // Check if already a member
  const existingMember = await projectRepository.getProjectMembership(projectId, targetUserId);
  if (existingMember) {
    throw new ApiError(400, "User is already a member of this project");
  }

  // SECURITY: Check if target user is actually in the tenant
  const isMemberOfTenant = await tenantMembershipRepository.isMember(tenantId, targetUserId);
  if (!isMemberOfTenant) {
    throw new ApiError(400, "The user you are trying to add is not a member of this tenant");
  }

  const newMember = await projectRepository.addProjectMember(projectId, targetUserId, role);

  // Invalidate project cache (members changed)
  await projectRedis.invalidateProjectCache(projectId, tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.MEMBER_ADD,
    entityType: 'PROJECT',
    entityId: projectId,
    actorUserId: userId,
    tenantId,
    newValue: { userId: targetUserId, role },
    req,
  });

  return newMember;
};

/**
 * Remove member from project
 */
export const removeMember = async (projectId, tenantId, targetUserId, userId, req) => {
  const project = await projectRepository.findProjectById(projectId, tenantId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check permissions
  const membership = await projectRepository.getProjectMembership(projectId, userId);
  const targetMembership = await projectRepository.getProjectMembership(projectId, targetUserId);

  if (!targetMembership) {
    throw new ApiError(404, "Member not found in project");
  }

  // Logic: 
  // 1. Can remove self (unless owner?)
  // 2. Owner can remove anyone except self
  // 3. Maintainer can remove members but not owners or other maintainers
  
  if (userId !== targetUserId) {
    if (!membership || (membership.role !== PROJECT_ROLES.OWNER && membership.role !== PROJECT_ROLES.MAINTAINER)) {
      throw new ApiError(403, "Insufficient permissions to remove members");
    }

    if (membership.role === PROJECT_ROLES.MAINTAINER && (targetMembership.role === PROJECT_ROLES.OWNER || targetMembership.role === PROJECT_ROLES.MAINTAINER)) {
      throw new ApiError(403, "Maintainers cannot remove owners or other maintainers");
    }
  } else {
    // If removing self and is owner, must promote someone else first or delete project
    if (targetMembership.role === PROJECT_ROLES.OWNER) {
      throw new ApiError(400, "Owners cannot remove themselves. Promote another member or delete the project.");
    }
  }

  await projectRepository.removeProjectMember(projectId, targetUserId);

  // Invalidate project cache (members changed)
  await projectRedis.invalidateProjectCache(projectId, tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.MEMBER_REMOVE,
    entityType: 'PROJECT',
    entityId: projectId,
    actorUserId: userId,
    tenantId,
    newValue: { userId: targetUserId },
    req,
  });

  return { success: true };
};

/**
 * Update project member role
 */
export const updateMemberRole = async (projectId, tenantId, targetUserId, role, userId, req) => {
  const project = await projectRepository.findProjectById(projectId, tenantId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership || membership.role !== PROJECT_ROLES.OWNER) {
    throw new ApiError(403, "Only the project owner can change member roles");
  }

  const targetMembership = await projectRepository.getProjectMembership(projectId, targetUserId);
  if (!targetMembership) {
    throw new ApiError(404, "Member not found in project");
  }

  if (userId === targetUserId) {
    throw new ApiError(400, "Cannot change your own role. Promote another member first.");
  }

  const updated = await projectRepository.updateProjectMemberRole(projectId, targetUserId, role);

  await projectRedis.invalidateProjectCache(projectId, tenantId);

  await logAudit({
    action: PROJECT_AUDIT_ACTIONS.MEMBER_UPDATE,
    entityType: 'PROJECT',
    entityId: projectId,
    actorUserId: userId,
    tenantId,
    oldValue: { userId: targetUserId, role: targetMembership.role },
    newValue: { userId: targetUserId, role },
    req,
  });

  return updated;
};

/**
 * Get project dashboard stats
 */
export const getProjectDashboard = async (projectId, tenantId, userId) => {
  const project = await projectRepository.findProjectById(projectId, tenantId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const membership = await projectRepository.getProjectMembership(projectId, userId);
  if (!membership) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const stats = await projectRepository.getProjectDashboardStats(projectId, tenantId);
  return { project, stats, userRole: membership.role };
};
