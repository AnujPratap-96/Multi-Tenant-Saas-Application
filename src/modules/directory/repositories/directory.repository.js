import prisma from "../../../lib/prisma.js";

export const listDirectory = async (tenantId, { page = 1, limit = 20, search = "", departmentId = null }) => {
  const skip = (page - 1) * limit;
  const where = {
    tenantId,
    status: "ACTIVE",
    user: {},
  };
  if (departmentId) where.user.homeDepartmentId = departmentId;
  if (search) {
    where.user.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  const [members, total] = await Promise.all([
    prisma.tenantUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { joinedAt: "asc" },
      select: {
        role: true,
        status: true,
        homeDepartmentId: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            homeDepartment: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.tenantUser.count({ where }),
  ]);
  return {
    members: members.map((m) => ({
      ...m.user,
      tenantRole: m.role,
      membershipStatus: m.status,
      homeDepartmentId: m.homeDepartmentId,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
