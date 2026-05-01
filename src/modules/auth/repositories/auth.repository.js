
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
      user: true,
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