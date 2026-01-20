// auth.repository.js
import { prisma } from "../../lib/prisma.js";

export const upsertOtp = ({ email, otp, expiresAt }) => {
  return prisma.emailOtp.upsert({
    where: { email },
    update: {
      otp,
      expiresAt,
      attempts: 0,
      verified: false,
    },
    create: {
      email,
      otp,
      expiresAt,
    },
  });
};

export const findByEmail = (email) => {
  return prisma.emailOtp.findUnique({
    where: { email },
  });
};

export const incrementAttempts = (email) => {
  return prisma.emailOtp.update({
    where: { email },
    data: {
      attempts: { increment: 1 },
    },
  });
};

export const markVerifiedAndDelete = (email) => {
  return prisma.emailOtp.delete({
    where: { email },
  });
};

export const createOtp = (data) => {
  return prisma.emailOtp.create({ data });
};

export const findLatestValidOtp = ({ email, purpose, deviceId }) => {
  return prisma.emailOtp.findFirst({
    where: {
      email,
      purpose,
      deviceId,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
};


export const markUsed = (id) => {
  return prisma.emailOtp.update({
    where: { id },
    data: { usedAt: new Date() },
  });
};
