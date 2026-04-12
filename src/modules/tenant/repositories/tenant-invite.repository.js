// Tenant invite repository - Database operations for tenant invites
import prisma from "../../../lib/prisma.js";
import { redisClient } from "../../../config/redis.js";
import { INVITE_EXPIRY_DAYS } from "../constants/tenant.constants.js";

const buildInviteKey = (token) => `tenant:invite:${token}`;

/**
 * Store invite token in Redis
 * @param {string} token - Invite token
 * @param {Object} data - Invite data
 */
export const storeInviteToken = async (token, data) => {
  const key = buildInviteKey(token);
  const ttl = INVITE_EXPIRY_DAYS * 24 * 60 * 60; // Convert days to seconds
  await redisClient.set(key, JSON.stringify(data), { EX: ttl });
};

/**
 * Get invite by token
 * @param {string} token - Invite token
 * @returns {Promise<Object|null>} Invite data
 */
export const getInviteByToken = async (token) => {
  const key = buildInviteKey(token);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Delete invite token
 * @param {string} token - Invite token
 */
export const deleteInviteToken = async (token) => {
  const key = buildInviteKey(token);
  await redisClient.del(key);
};

/**
 * Create invite (store in Redis and create TenantUser with INVITED status)
 * @param {Object} data - Invite data
 * @returns {Promise<Object>} Created invite
 */
export const createInvite = async (data) => {
  const { tenantId, email, role, invitedById, token } = data;

  // Store token in Redis
  await storeInviteToken(token, {
    tenantId,
    email,
    role,
    invitedById,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Also create TenantUser record with INVITED status
  // First, check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  let membership;
  if (user) {
    // Check if already a member
    const existing = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
    });

    if (existing && existing.status === 'REMOVED') {
      // Reactivate as invited
      membership = await prisma.tenantUser.update({
        where: {
          tenantId_userId: {
            tenantId,
            userId: user.id,
          },
        },
        data: {
          role,
          status: 'INVITED',
          invitedById,
          removedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } else if (!existing) {
      // Create new invitation
      membership = await prisma.tenantUser.create({
        data: {
          tenantId,
          userId: user.id,
          role,
          status: 'INVITED',
          invitedById,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } else {
      throw new Error('User is already a member of this tenant');
    }
  }

  return {
    token,
    email,
    role,
    tenantId,
    invitedById,
    status: 'PENDING',
    user: user || null,
    membership,
  };
};

/**
 * List pending invites for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of invites
 */
export const listInvites = async (tenantId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Get invited members from database
  const [invites, total] = await Promise.all([
    prisma.tenantUser.findMany({
      where: {
        tenantId,
        status: 'INVITED',
      },
      skip,
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.tenantUser.count({
      where: {
        tenantId,
        status: 'INVITED',
      },
    }),
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
 * Cancel invite (remove TenantUser with INVITED status)
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Cancelled invite
 */
export const cancelInvite = async (tenantId, userId) => {
  return await prisma.tenantUser.update({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    data: {
      status: 'REMOVED',
      removedAt: new Date(),
    },
  });
};

/**
 * Accept invite (update status from INVITED to ACTIVE)
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated membership
 */
export const acceptInvite = async (tenantId, userId) => {
  return await prisma.tenantUser.update({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    data: {
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
};

/**
 * Reject invite (remove membership)
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Rejected membership
 */
export const rejectInvite = async (tenantId, userId) => {
  return await prisma.tenantUser.update({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    data: {
      status: 'REMOVED',
      removedAt: new Date(),
    },
  });
};

/**
 * Find invite by email and tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} email - User email
 * @returns {Promise<Object|null>} Invite
 */
export const findInviteByEmail = async (tenantId, email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  return await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId: user.id,
      status: 'INVITED',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });
};
