// Tenant settings service - Business logic for tenant settings (D-14)
import { ApiError } from "../../../utils/api-error.js";
import { redisClient } from "../../../config/redis.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import * as settingsRepository from "../repositories/tenant-settings.repository.js";

const buildSettingsKey = (tenantId) => `tenant:settings:${tenantId}`;

/**
 * Read-through: Redis cache -> DB (D-14/S-18)
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object>} Settings
 */
const readSettings = async (tenantId) => {
  const key = buildSettingsKey(tenantId);

  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const row = await settingsRepository.findSettings(tenantId);
  const settings = row ? row.settings : {};

  // Populate cache
  await redisClient.set(key, JSON.stringify(settings));

  return settings;
};

/**
 * Write-through: DB then Redis (D-14/S-18)
 * @param {string} tenantId - Tenant ID
 * @param {Object} settings - Settings payload
 */
const writeSettings = async (tenantId, settings) => {
  await settingsRepository.upsertSettings(tenantId, settings);
  await redisClient.set(buildSettingsKey(tenantId), JSON.stringify(settings));
};

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
  const tenant = await tenantRepository.findActiveTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  return readSettings(tenantId);
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
  const tenant = await tenantRepository.findActiveTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Merge new settings
  const currentSettings = await readSettings(tenantId);
  const newSettings = {
    ...currentSettings,
    ...data.settings,
  };

  await writeSettings(tenantId, newSettings);

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
  const tenant = await tenantRepository.findActiveTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Delete from DB and Redis
  await settingsRepository.deleteSettings(tenantId);
  await redisClient.del(buildSettingsKey(tenantId));
};
