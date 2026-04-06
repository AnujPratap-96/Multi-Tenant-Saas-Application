// Tenant settings controller - HTTP handling for settings operations
import * as settingsService from "../services/tenant-settings.service.js";
import { successResponse } from "../../../utils/response.js";

/**
 * Get settings for a tenant
 * @route GET /api/v1/tenants/:id/settings
 */
export const getSettingsController = async (req, res, next) => {
  const { id } = req.params;
  const settings = await settingsService.getSettings(id, req.userId);
  return successResponse(res, {
    message: "Settings retrieved successfully",
    data: settings,
  });
};

/**
 * Update settings for a tenant
 * @route PATCH /api/v1/tenants/:id/settings
 */
export const updateSettingsController = async (req, res, next) => {
  const { id } = req.params;
  const settings = await settingsService.updateSettings(id, req.body, req.userId);
  return successResponse(res, {
    message: "Settings updated successfully",
    data: settings,
  });
};

/**
 * Delete settings for a tenant
 * @route DELETE /api/v1/tenants/:id/settings
 */
export const deleteSettingsController = async (req, res, next) => {
  const { id } = req.params;
  await settingsService.deleteSettings(id, req.userId);
  return successResponse(res, {
    message: "Settings deleted successfully",
  });
};
