// Project controller - HTTP handling for project operations
import * as projectService from "../services/project.service.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

/**
 * Create a new project
 */
export const createProjectController = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.tenantId, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Project created successfully",
    data: project,
  });
});

/**
 * Get project by ID
 */
export const getProjectController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await projectService.getProject(id, req.tenantId, req.userId);
  return successResponse(res, {
    message: "Project retrieved successfully",
    data: project,
  });
});

/**
 * List projects
 */
export const listProjectsController = asyncHandler(async (req, res) => {
  const options = {
    page: req.query.page ? parseInt(req.query.page) : 1,
    limit: req.query.limit ? parseInt(req.query.limit) : 20,
    search: req.query.search,
    isArchived: req.query.isArchived === 'true',
  };
  const result = await projectService.listProjects(req.tenantId, options);
  return successResponse(res, {
    message: "Projects retrieved successfully",
    data: result,
  });
});

/**
 * Update project
 */
export const updateProjectController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await projectService.updateProject(id, req.tenantId, req.body, req.userId, req);
  return successResponse(res, {
    message: "Project updated successfully",
    data: project,
  });
});

/**
 * Delete project
 */
export const deleteProjectController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await projectService.deleteProject(id, req.tenantId, req.userId, req);
  return successResponse(res, {
    message: "Project deleted successfully",
  });
});

/**
 * Add member to project
 */
export const addMemberController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await projectService.addMember(id, req.tenantId, req.body, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Member added successfully",
    data: member,
  });
});

/**
 * Remove member from project
 */
export const removeMemberController = asyncHandler(async (req, res) => {
  const { id, userId: targetUserId } = req.params;
  await projectService.removeMember(id, req.tenantId, targetUserId, req.userId, req);
  return successResponse(res, {
    message: "Member removed successfully",
  });
});

/**
 * Update member role
 */
export const updateMemberRoleController = asyncHandler(async (req, res) => {
  const { id, userId: targetUserId } = req.params;
  const { role } = req.body;
  const member = await projectService.updateMemberRole(id, req.tenantId, targetUserId, role, req.userId, req);
  return successResponse(res, {
    message: "Member role updated successfully",
    data: member,
  });
});

/**
 * Get project dashboard
 */
export const getProjectDashboardController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await projectService.getProjectDashboard(id, req.tenantId, req.userId);
  return successResponse(res, {
    message: "Project dashboard retrieved successfully",
    data: result,
  });
});
