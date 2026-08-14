// Tenant controller - HTTP handling for tenant operations
import * as tenantService from "../services/tenant.service.js";
import { successResponse } from "../../../utils/response.js";

/**
 * Create a new tenant
 * @route POST /api/v1/tenants
 */
export const createTenantController = async (req, res, next) => {
  const tenant = await tenantService.createTenant(req.body, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Tenant created successfully",
    data: tenant,
  });
};

/**
 * Get tenant by ID
 * @route GET /api/v1/tenants/:id
 */
export const getTenantController = async (req, res, next) => {
  const { id } = req.params;
  const tenant = await tenantService.getTenant(id, req.userId);
  return successResponse(res, {
    message: "Tenant retrieved successfully",
    data: tenant,
  });
};

/**
 * Update tenant
 * @route PATCH /api/v1/tenants/:id
 */
export const updateTenantController = async (req, res, next) => {
  const { id } = req.params;
  const tenant = await tenantService.updateTenant(id, req.body, req.userId, req);
  return successResponse(res, {
    message: "Tenant updated successfully",
    data: tenant,
  });
};

/**
 * Delete (soft delete) tenant
 * @route DELETE /api/v1/tenants/:id
 */
export const deleteTenantController = async (req, res, next) => {
  const { id } = req.params;
  await tenantService.deleteTenant(id, req.userId, req);
  return successResponse(res, {
    message: "Tenant deleted successfully",
  });
};

/**
 * Restore tenant
 * @route POST /api/v1/tenants/:id/restore
 */
export const restoreTenantController = async (req, res, next) => {
  const { id } = req.params;
  const tenant = await tenantService.restoreTenant(id, req.userId, req);
  return successResponse(res, {
    message: "Tenant restored successfully",
    data: tenant,
  });
};

/**
 * List tenants for current user
 * @route GET /api/v1/tenants
 */
export const listTenantsController = async (req, res, ) => {
  const { page, limit, search, isActive } = req.query;
  const result = await tenantService.listTenants(req.userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
  });
  return successResponse(res, {
    message: "Tenants retrieved successfully",
    data: result,
  });
};

/**
 * Switch to a different tenant
 * @route POST /api/v1/tenants/:id/switch
 */
export const switchTenantController = async (req, res, next) => {
  const { id } = req.params;
  const result = await tenantService.switchTenant(id, req.userId, req);
  return successResponse(res, {
    message: "Tenant switched successfully",
    data: result,
  });
};

/**
 * Get user's tenant memberships
 * @route GET /api/v1/tenants/my
 */
export const getUserTenantsController = async (req, res, next) => {
  const tenants = await tenantService.getUserTenants(req.userId);
  return successResponse(res, {
    message: "User tenants retrieved successfully",
    data: tenants,
  });
};
