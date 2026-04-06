// Tenant settings service - Business logic for tenant settings
import { ApiError } from "../../../utils/api-error.js";
import { redisClient } from "../../../config/redis.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";

const buildSettingsKey = (tenantId) => `tenant:settings:${tenantId}`;

/**
 * Get settings for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Settings
 */
export const getSettings = async (tenantId, userId) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can view settings");
  }

  // Check if tenant exists
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Get settings from Redis
  const key = buildSettingsKey(tenantId);
  const settings = await redisClient.get(key);
  
  return settings ? JSON.parse(settings) : {};
};

/**
 * Update settings for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} data - Settings data
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Updated settings
 */
export const updateSettings = async (tenantId, data, userId) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can update settings");
  }

  // Check if tenant exists
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Get existing settings
  const key = buildSettingsKey(tenantId);
  const existingSettings = await redisClient.get(key);
  const currentSettings = existingSettings ? JSON.parse(existingSettings) : {};

  // Merge new settings
  const newSettings = {
    ...currentSettings,
    ...data.settings,
  };

  // Save to Redis (no expiry for settings)
  await redisClient.set(key, JSON.stringify(newSettings));

  return newSettings;
};

/**
 * Delete settings for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @returns {Promise<void>}
 */
export const deleteSettings = async (tenantId, userId) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can delete settings");
  }

  // Check if tenant exists
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Delete settings from Redis
  const key = buildSettingsKey(tenantId);
  await redisClient.del(key);
};
