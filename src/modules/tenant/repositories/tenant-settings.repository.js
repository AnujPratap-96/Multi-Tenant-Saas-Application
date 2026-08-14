// Tenant settings repository - Database operations for tenant settings (D-14)
import prisma from "../../../lib/prisma.js";

export const findSettings = async (tenantId) => {
  return prisma.tenantSettings.findUnique({ where: { tenantId } });
};

export const upsertSettings = async (tenantId, settings) => {
  return prisma.tenantSettings.upsert({
    where: { tenantId },
    update: { settings },
    create: { tenantId, settings },
  });
};

export const deleteSettings = async (tenantId) => {
  return prisma.tenantSettings.delete({ where: { tenantId } });
};
