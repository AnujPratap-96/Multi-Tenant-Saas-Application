import prisma from "../../lib/prisma.js";


export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export const createUser = async ({
  email,
  password,
}) => {
  return prisma.user.create({
    data: {
      email,
      password,
      emailVerified: true,   
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
