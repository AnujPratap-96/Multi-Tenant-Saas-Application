import crypto from "crypto";
import { revokeSessionByHash } from "../repositories/auth.repository.js";
import { createAuditLog } from "../../audit-log/audit-log.repository.js";

export const logoutService = async ({ userId, refreshToken, ipAddress, userAgent }) => {
    if (!userId) {
        throw new Error("User ID is required for logout");
    }

    if (refreshToken) {
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
        await revokeSessionByHash(refreshTokenHash);
    }

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