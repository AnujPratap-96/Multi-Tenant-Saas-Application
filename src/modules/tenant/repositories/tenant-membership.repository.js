// Tenant membership repository - Database operations for tenant members
import { prisma } from "../../../lib/prisma.js";

/**
 * Add a member to a tenant
 * @param {Object} data - Membership data
 * @returns {Promise<Object>} Created membership
 */
export const addMember = async (data) => {
  return await prisma.tenantUser.create({
    data,
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
  });
};

/**
 * Find membership by tenant and user ID
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Membership or null
 */
export const findMembership = async (tenantId, userId) => {
  return await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
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
      invitedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

/**
 * Update member role
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated membership
 */
export const updateMember = async (tenantId, userId, data) => {
  return await prisma.tenantUser.update({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    data,
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
 * Remove member from tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Removed membership
 */
export const removeMember = async (tenantId, userId) => {
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
 * Suspend member
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Suspended membership
 */
export const suspendMember = async (tenantId, userId) => {
  return await prisma.tenantUser.update({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    data: {
      status: 'SUSPENDED',
    },
  });
};

/**
 * Restore suspended member
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Restored membership
 */
export const restoreMember = async (tenantId, userId) => {
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
  });
};

/**
 * List members of a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of members
 */
export const listMembers = async (tenantId, options = {}) => {
  const { page = 1, limit = 20, status, role } = options;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    status: { not: 'REMOVED' },
  };

  if (status) {
    where.status = status;
  }

  if (role) {
    where.role = role;
  }

  const [members, total] = await Promise.all([
    prisma.tenantUser.findMany({
      where,
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
            isActive: true,
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
    prisma.tenantUser.count({ where }),
  ]);

  return {
    members,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Check if user is admin of tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isTenantAdmin = async (tenantId, userId) => {
  const membership = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  return !!membership;
};

/**
 * Check if user can manage members (admin or manager)
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const canManageMembers = async (tenantId, userId) => {
  const membership = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId,
      role: { in: ['ADMIN', 'MANAGER'] },
      status: 'ACTIVE',
    },
  });
  return !!membership;
};

/**
 * Get all active members of a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} List of active members
 */
export const getActiveMembers = async (tenantId) => {
  return await prisma.tenantUser.findMany({
    where: {
      tenantId,
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
 * Check if user is member of tenant (any status except REMOVED)
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isMember = async (tenantId, userId) => {
  const membership = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId,
      status: { not: 'REMOVED' },
    },
  });
  return !!membership;
};
