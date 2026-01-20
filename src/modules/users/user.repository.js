import prisma from "../../lib/prisma.js";


export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
}