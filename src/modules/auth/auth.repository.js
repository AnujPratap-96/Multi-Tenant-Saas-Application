// auth.repository.js
import prisma from '../../lib/prisma.js';

export const findActiveOtp = async ({ email, purpose }) => {
  return prisma.emailOtp.findFirst({
    where: {
      email,
      purpose,
      isActive: true,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const deactivateOtp = async (id) => {
  return prisma.emailOtp.update({
    where: { id },
    data: { isActive: false },
  });
};


export const createOtp = async (data) => {
  return prisma.emailOtp.create({ data });
};

export const incrementAttempts = async (id) => {
  return prisma.emailOtp.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
    },
  });
};

export const markOtpAsUsed = async (id) => {
  return prisma.emailOtp.update({
    where: { id },
    data: {
      usedAt: new Date(),
      isActive: false,
    },
  });
};


export const deleteOtpByEmailPurpose = async ({ email, purpose }) => {
  return prisma.emailOtp.deleteMany({
    where: { email, purpose },
  });
};



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

export const revokeAuthSessionByRefreshToken = async (refreshToken) => {
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
};