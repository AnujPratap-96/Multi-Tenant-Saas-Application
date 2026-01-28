import prisma from "../../lib/prisma.js";


export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export const createUser = async ({
  email,
  passwordHash,
}) => {
  return prisma.user.create({
    data: {
      email,
      password: passwordHash,
      emailVerified: true,   // because OTP already verified
      isActive: true,
    },
  });
};


export const updateLastLogin = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};
