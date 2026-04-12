// Tenant repository - Database operations for tenants
import prisma from "../../../lib/prisma.js";


/**
 * Create a new tenant
 * @param {Object} data - Tenant data
 * @returns {Promise<Object>} Created tenant
 */
export const createTenantWithOwner = async ({ name, slug, plan, ownerUserId }) => {
  return await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
        ownerUserId,
        plan,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await tx.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUserId,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await tx.tenantOwnership.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUserId,
      },
    });

    return tenant;
  });
};

export const createTenant = async (data) => {
  return await prisma.tenant.create({
    data,
    include: {
      owner: {
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
 * Find tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Promise<Object|null>} Tenant or null
 */

export const findTenantBySlug = async (slug) => {
  return await prisma.tenant.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Find active tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Promise<Object|null>} Active tenant or null
 */
export const findActiveTenantById = async (id) => {
  return await prisma.tenant.findFirst({
    where: { 
      id,
      isActive: true,
      deletedAt: null,
    },
    include: {
      owner: {
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
 * Find tenant by ID including deleted
 * @param {string} id - Tenant ID
 * @returns {Promise<Object|null>} Tenant or null
 */
export const findTenantByIdIncludingDeleted = async (id) => {
  return await prisma.tenant.findUnique({
    where: { id },
    include: {
      owner: {
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
 * Update tenant
 * @param {string} id - Tenant ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated tenant
 */
export const updateTenant = async (id, data) => {
  return await prisma.tenant.update({
    where: { id },
    data,
    include: {
      owner: {
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
 * Soft delete tenant
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} Deleted tenant
 */
export const softDeleteTenant = async (id) => {
  return await prisma.tenant.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
};

/**
 * Restore tenant
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} Restored tenant
 */
export const restoreTenant = async (id) => {
  return await prisma.tenant.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
  });
};

/**
 * List tenants for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of tenants
 */
export const listTenantsForUser = async (userId, options = {}) => {
  const { page = 1, limit = 20, search, isActive } = options;
  const skip = (page - 1) * limit;

  const where = {
    tenantUsers: {
      some: {
        userId,
        status: 'ACTIVE',
      },
    },
    deletedAt: null,
  };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
        createdAt: true,
        tenantUsers: {
          where: { userId },
          select: {
            role: true,
            status: true,
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    tenants: tenants.map(({ tenantUsers, ...tenant }) => ({
      ...tenant,
      role: tenantUsers[0]?.role,
      membershipStatus: tenantUsers[0]?.status,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
/**
 * Check if user is owner of tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isTenantOwner = async (tenantId, userId) => {
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      ownerUserId: userId,
    },
  });
  return !!tenant;
};

/**
 * Check if user is member of tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export const findTenantMembership = async (tenantId, userId) => {
  return await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });
};

/**
 * Get user's tenants (for /my endpoint)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of tenant memberships
 */
export const getUserTenants = async (userId) => {
  return await prisma.tenantUser.findMany({
    where: {
      userId,
      status: { not: 'REMOVED' },
      tenant: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      tenant: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
};
