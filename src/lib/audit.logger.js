import { prisma } from "../../config/prisma.js";
export const logAudit = async ({
  action,
  entityType,
  entityId = null,
  actorUserId = null,
  subjectUserId = null,
  tenantId = null,
  oldValue = null,
  newValue = null,
  req = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorUserId,
        subjectUserId,
        tenantId,
        oldValue,
        newValue,
        ipAddress: req?.ip ?? null,
        userAgent: req?.headers?.["user-agent"] ?? null,
      },
    });
  } catch (err) {
    // ❗ Never break main flow because of audit
    console.error("Audit log failed:", err);
  }
};
