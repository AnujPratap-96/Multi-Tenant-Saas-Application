// auth.repository.js
import prisma from '../../lib/prisma.js';

export const findActiveOtp = async ({ email, purpose }) => {
  return prisma.emailOtp.findFirst({
    where: {
      email,
      purpose,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
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

export const markUsed = async (id) => {
  return prisma.emailOtp.update({
    where: { id },
    data: { usedAt: new Date() },
  });
};

export const deleteOtpByEmailPurpose = async ({ email, purpose }) => {
  return prisma.emailOtp.deleteMany({
    where: { email, purpose },
  });
};
export const findByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};