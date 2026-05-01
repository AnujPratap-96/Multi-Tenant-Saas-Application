// User service - Business logic for user operations
import { ApiError } from "../../utils/api-error.js";
import * as userRepository from "./user.repository.js";
import { mapUserToResponse } from "./utils/map-user-fields.js";
import * as userRedis from "./redis/user.redis.js";

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Mapped user object
 */
export const getUserProfile = async (userId) => {
  // Try to get from cache
  const cachedUser = await userRedis.getCachedUser(userId);
  if (cachedUser) return cachedUser;

  const user = await userRepository.findActiveUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const mappedUser = mapUserToResponse(user);
  
  // Save to cache
  await userRedis.setCachedUser(userId, mappedUser);
  
  return mappedUser;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Mapped updated user object
 */
export const updateProfile = async (userId, updateData) => {
  const user = await userRepository.findActiveUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await userRepository.updateUser(userId, updateData);
  const mappedUser = mapUserToResponse(updatedUser);

  // Invalidate cache
  await userRedis.invalidateUserCache(userId);

  return mappedUser;
};
