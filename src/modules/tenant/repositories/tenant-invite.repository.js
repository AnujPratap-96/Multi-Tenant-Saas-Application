// Tenant invite repository - Database operations for tenant invites (D-7)
import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { redisClient } from "../../../config/redis.js";
import { INVITE_EXPIRY_DAYS } from "../constants/tenant.constants.js";

const buildInviteKey = (token) => `tenant:invite:${token}`;

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Store invite token in Redis (7-day TTL)
 * @param {string} token - Invite token
 * @param {Object} data - Invite data
 */
export const storeInviteToken = async (token, data) => {
  const key = buildInviteKey(token);
  const ttl = INVITE_EXPIRY_DAYS * 24 * 60 * 60; // Convert days to seconds
  await redisClient.set(key, JSON.stringify(data), { EX: ttl });
};

/**
 * Get invite by token from Redis
 * @param {string} token - Invite token
 * @returns {Promise<Object|null>} Invite data
 */
export const getInviteByToken = async (token) => {
  const key = buildInviteKey(token);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Delete invite token from Redis
 * @param {string} token - Invite token
 */
export const deleteInviteToken = async (token) => {
  const key = buildInviteKey(token);
  await redisClient.del(key);
};

/**
 * Create or reactivate an invite row keyed by (tenantId, email)
 * Re-inviting after CANCELLED/REJECTED resets the row to PENDING.
 * @param {Object} data - Invite data
 * @returns {Promise<Object>} Created invite row
 */
export const upsertInvite = async ({
  tenantId,
  email,
  role,
  invitedById,
  tokenHash,
  expiresAt,
}) => {
  return prisma.tenantInvite.upsert({
    where: {
      tenantId_email: { tenantId, email },
    },
    update: {
      role,
      invitedById,
      tokenHash,
      status: 'PENDING',
      expiresAt,
      acceptedAt: null,
    },
    create: {
      tenantId,
      email,
      role,
      invitedById,
      tokenHash,
      status: 'PENDING',
      expiresAt,
    },
    include: {
      invitedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
};

/**
 * Find pending invite by email and tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} email - Invited email
 * @returns {Promise<Object|null>} Invite row
 */
export const findInviteByEmail = async (tenantId, email) => {
  return prisma.tenantInvite.findUnique({
    where: {
      tenantId_email: { tenantId, email },
    },
    include: {
      invitedBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
};

/**
 * Find invite by id scoped to a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} inviteId - Invite ID
 * @returns {Promise<Object|null>} Invite row
 */
export const findInviteById = async (tenantId, inviteId) => {
  return prisma.tenantInvite.findFirst({
    where: { id: inviteId, tenantId },
  });
};

/**
 * List invites for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of invites
 */
export const listInvites = async (tenantId, options = {}) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const where = { tenantId };
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [invites, total] = await Promise.all([
    prisma.tenantInvite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.tenantInvite.count({ where }),
  ]);

  return {
    invites,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update invite status by id
 * @param {string} inviteId - Invite ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated invite
 */
export const updateInviteStatus = async (inviteId, data) => {
  return prisma.tenantInvite.update({
    where: { id: inviteId },
    data,
  });
};
