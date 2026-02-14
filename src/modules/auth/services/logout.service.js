import { invalidateUserSessions } from "../repositories/auth.repository.js";

import { createAuditLog } from "../../audit-log/audit-log.repository.js";

export const logoutService = async (userId, ipAddress, userAgent) => {
    if (!userId) {
        throw new Error("User ID is required for logout");
    }
    await invalidateUserSessions(userId);
   
      await createAuditLog({
        userId,
        action: "LOGOUT",
        entityType: "SESSION",
        entityId: userId,
        ipAddress,
        userAgent,
      });
    return { success: true, message: "Logout successful" };
};