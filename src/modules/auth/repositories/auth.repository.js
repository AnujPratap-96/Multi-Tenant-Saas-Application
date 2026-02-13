
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