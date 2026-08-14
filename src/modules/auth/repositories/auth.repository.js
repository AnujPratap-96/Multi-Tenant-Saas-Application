
import prisma from '../../../lib/prisma.js';



export const createAuthSession = async ({
  userId,
  refreshTokenHash,
  ipAddress,
  userAgent,
  expiresAt,
}) => {
  return prisma.authSession.create({
    data: {
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });
};

export const invalidateUserSessions = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to invalidate sessions");
  }

  await prisma.authSession.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
};

export const findSessionByHash = async (refreshTokenHash) => {
  return prisma.authSession.findFirst({
    where: {
      refreshTokenHash,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
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
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
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

export const revokeSessionByHash = async (refreshTokenHash) => {
  if (!refreshTokenHash) {
    throw new Error("Refresh token hash is required to revoke a session");
  }

  const session = await prisma.authSession.findFirst({
    where: {
      refreshTokenHash,
      isRevoked: false,
    },
  });

  if (!session) return null;

  return prisma.authSession.update({
    where: { id: session.id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
};