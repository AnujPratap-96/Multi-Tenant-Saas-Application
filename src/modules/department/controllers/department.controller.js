import { successResponse } from "../../../utils/response.js";
import * as departmentService from "../services/department.service.js";

export const createDepartmentController = async (req, res) => {
  const { tenantId, userId } = req;
  const result = await departmentService.createDepartment({
    tenantId,
    userId,
    data: req.validated.body,
    req,
  });
  return successResponse(res, { data: result }, 201);
};

export const getDepartmentController = async (req, res) => {
  const result = await departmentService.getDepartment({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
  });
  return successResponse(res, { data: result });
};

export const listDepartmentsController = async (req, res) => {
  const result = await departmentService.listDepartments({
    tenantId: req.tenantId,
    userId: req.userId,
    options: req.validated.query,
  });
  return successResponse(res, { data: result });
};

export const updateDepartmentController = async (req, res) => {
  const result = await departmentService.updateDepartment({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    data: req.validated.body,
    req,
  });
  return successResponse(res, { data: result });
};

export const deleteDepartmentController = async (req, res) => {
  const result = await departmentService.deleteDepartment({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    req,
  });
  return successResponse(res, { data: result });
};

export const addMemberController = async (req, res) => {
  const result = await departmentService.addMember({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    data: req.validated.body,
    req,
  });
  return successResponse(res, { data: result }, 201);
};

export const listMembersController = async (req, res) => {
  const result = await departmentService.listMembers({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    options: req.validated.query,
  });
  return successResponse(res, { data: result });
};

export const removeMemberController = async (req, res) => {
  const result = await departmentService.removeMember({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    targetUserId: req.validated.params.userId,
    req,
  });
  return successResponse(res, { data: result });
};

// Task types
export const createTaskTypeController = async (req, res) => {
  const result = await departmentService.createTaskType({
    tenantId: req.tenantId,
    userId: req.userId,
    data: req.validated.body,
    req,
  });
  return successResponse(res, { data: result }, 201);
};

export const listTaskTypesController = async (req, res) => {
  const result = await departmentService.listTaskTypes({ tenantId: req.tenantId });
  return successResponse(res, { data: result });
};

export const updateTaskTypeController = async (req, res) => {
  const result = await departmentService.updateTaskType({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    data: req.validated.body,
    req,
  });
  return successResponse(res, { data: result });
};

export const deleteTaskTypeController = async (req, res) => {
  const result = await departmentService.deleteTaskType({
    id: req.validated.params.id,
    tenantId: req.tenantId,
    userId: req.userId,
    req,
  });
  return successResponse(res, { data: result });
};
