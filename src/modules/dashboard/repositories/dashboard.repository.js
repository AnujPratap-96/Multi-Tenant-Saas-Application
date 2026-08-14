import prisma from "../../../lib/prisma.js";

export const getDashboardStats = async (tenantId) => {
  const [projectCount, memberCount, taskCounts] = await Promise.all([
    prisma.project.count({
      where: { tenantId, deletedAt: null, isArchived: false },
    }),
    prisma.tenantUser.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const taskStats = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  taskCounts.forEach((t) => {
    taskStats[t.status] = t._count.id;
  });

  return {
    projects: { total: projectCount },
    tasks: { total: Object.values(taskStats).reduce((a, b) => a + b, 0), ...taskStats },
    members: { total: memberCount },
  };
};
