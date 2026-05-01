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

/**
 * Update user's password
 */
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
