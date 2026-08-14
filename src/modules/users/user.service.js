import { ApiError } from "../../utils/api-error.js";
import * as userRepository from "./user.repository.js";
import { mapUserToResponse } from "./utils/map-user-fields.js";
import * as userRedis from "./redis/user.redis.js";
import * as tenantRedis from "../tenant/redis/tenant.redis.js";

export const getUserProfile = async (userId) => {
  const cachedUser = await userRedis.getCachedUser(userId);
  if (cachedUser) return cachedUser;

  const user = await userRepository.findActiveUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const mappedUser = mapUserToResponse(user);

  await userRedis.setCachedUser(userId, mappedUser);

  return mappedUser;
};

export const updateProfile = async (userId, updateData) => {
  const user = await userRepository.findActiveUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await userRepository.updateUser(userId, updateData);
  const mappedUser = mapUserToResponse(updatedUser);

  await userRedis.invalidateUserCache(userId);

  return mappedUser;
};

// ──────────────────────────────────────────────
// Tenant-scoped user list
// ──────────────────────────────────────────────

export const listUsers = async (tenantId, query) => {
  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));
  const q = query.q?.trim();
  const role = query.role;
  const status = query.status;

  const { memberships, total } = await userRepository.listUsersByTenant(tenantId, {
    page, limit, q, role, status,
  });

  const users = memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    avatarUrl: m.user.avatarUrl,
    emailVerified: m.user.emailVerified,
    isActive: m.user.isActive,
    lastLoginAt: m.user.lastLoginAt,
    createdAt: m.user.createdAt,
    membershipRole: m.role,
    membershipStatus: m.status,
    joinedAt: m.joinedAt,
  }));

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserDetail = async (tenantId, userId) => {
  const membership = await userRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "User not found in this tenant");
  }

  // S-16: no session data in admin view — sessions are self-service only
  return {
    id: membership.user.id,
    email: membership.user.email,
    firstName: membership.user.firstName,
    lastName: membership.user.lastName,
    avatarUrl: membership.user.avatarUrl,
    emailVerified: membership.user.emailVerified,
    isActive: membership.user.isActive,
    lastLoginAt: membership.user.lastLoginAt,
    createdAt: membership.user.createdAt,
    membershipRole: membership.role,
    membershipStatus: membership.status,
    joinedAt: membership.joinedAt,
  };
};

export const updateUserByAdmin = async (currentUserId, targetUserId, tenantId, updateData) => {
  // SECURITY: target user must be a member of this tenant
  const membership = await userRepository.findMembership(tenantId, targetUserId);
  if (!membership) {
    throw new ApiError(404, "User not found in this tenant");
  }

  // Split fields: user-level vs tenant-level
  const userFields = {};
  const membershipFields = {};

  if (updateData.firstName !== undefined) userFields.firstName = updateData.firstName;
  if (updateData.lastName !== undefined) userFields.lastName = updateData.lastName;
  if (updateData.avatarUrl !== undefined) userFields.avatarUrl = updateData.avatarUrl;
  if (updateData.emailVerified !== undefined) userFields.emailVerified = updateData.emailVerified;
  if (updateData.isActive !== undefined) userFields.isActive = updateData.isActive;
  if (updateData.role !== undefined) membershipFields.role = updateData.role;
  if (updateData.status !== undefined) membershipFields.status = updateData.status;

  // Update user table
  if (Object.keys(userFields).length > 0) {
    await userRepository.updateUser(targetUserId, userFields);
    await userRedis.invalidateUserCache(targetUserId);
  }

  // Update tenant membership
  if (Object.keys(membershipFields).length > 0 && tenantId) {
    await userRepository.updateMembership(tenantId, targetUserId, membershipFields);
    await tenantRedis.invalidateMembershipCache(tenantId, targetUserId);
  }

  // Fetch and return updated user
  const updatedUser = await userRepository.findUserById(targetUserId);
  return mapUserToResponse(updatedUser);
};

export const deleteUser = async (userId, tenantId) => {
  // SECURITY: membership-scoped — deactivating a user only removes them from this tenant
  const membership = await userRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "User not found in this tenant");
  }

  await userRepository.updateMembership(tenantId, userId, {
    status: 'REMOVED',
    removedAt: new Date(),
  });
  await tenantRedis.invalidateMembershipCache(tenantId, userId);

  return { message: "User deactivated successfully" };
};

export const reactivateUser = async (userId, tenantId) => {
  // SECURITY: membership-scoped — reactivating a user only restores their membership
  const membership = await userRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "User not found in this tenant");
  }

  await userRepository.updateMembership(tenantId, userId, {
    status: 'ACTIVE',
    removedAt: null,
  });
  await tenantRedis.invalidateMembershipCache(tenantId, userId);

  return { message: "User reactivated successfully" };
};

// ──────────────────────────────────────────────
// Session management
// ──────────────────────────────────────────────

export const getUserSessions = async (userId) => {
  const sessions = await userRepository.findUserSessions(userId);
  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    isRevoked: s.isRevoked,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt,
  }));
};

export const revokeUserSession = async (userId, sessionId) => {
  const session = await userRepository.findSessionById(sessionId);
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  if (session.userId !== userId) {
    throw new ApiError(403, "You can only revoke your own sessions");
  }

  await userRepository.revokeSession(sessionId);
  return { message: "Session revoked successfully" };
};
