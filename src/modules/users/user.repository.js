import prisma from "../../lib/prisma.js";

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export const createUser = async ({
  email,
  password,
  emailVerified = false,
}) => {
  return prisma.user.create({
    data: {
      email,
      password,
      emailVerified,
      isActive: true,
    },
  });
};

export const findActiveUserById = async (id) => {
  return await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
    },
  });
};

export const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const updateUserPassword = async (userId, hashedPassword) => {
  if (!userId || !hashedPassword) {
    throw new Error("User ID and password are required");
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      updatedAt: true,
    },
  });
  return user;
};

export const updateLastLogin = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};

// ──────────────────────────────────────────────
// Tenant-scoped user list queries
// ──────────────────────────────────────────────

export const listUsersByTenant = async (tenantId, { page, limit, q, role, status }) => {
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(status && status !== 'ALL' ? { status } : { status: { not: 'REMOVED' } }),
    ...(role && role !== 'ALL' ? { role } : {}),
    ...(q
      ? {
          user: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [memberships, total] = await Promise.all([
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
            emailVerified: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.tenantUser.count({ where }),
  ]);

  return { memberships, total };
};

export const findMembership = async (tenantId, userId) => {
  return prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
  });
};

export const updateMembership = async (tenantId, userId, data) => {
  return prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId } },
    data,
  });
};

export const softDeleteUser = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
};

export const reactivateUser = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      deletedAt: null,
    },
  });
};

// ──────────────────────────────────────────────
// Session queries
// ──────────────────────────────────────────────

export const findUserSessions = async (userId) => {
  return prisma.authSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const findSessionById = async (sessionId) => {
  return prisma.authSession.findUnique({
    where: { id: sessionId },
  });
};

export const revokeSession = async (sessionId) => {
  return prisma.authSession.update({
    where: { id: sessionId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
};
