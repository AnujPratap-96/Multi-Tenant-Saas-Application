// src/modules/auth/utils/password.audit.js

import { createAuditLog } from "../../audit-log/audit-log.repository.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";

export const createPasswordAuditLog = async ({
  action,
  user,
  ipAddress,
  userAgent,
}) => {
  const auditActions = {
    [PASSWORD_ACTION.SIGNUP]: "CREATE",
    [PASSWORD_ACTION.SET_PASSWORD]: "UPDATE",
    [PASSWORD_ACTION.RESET_PASSWORD]: "UPDATE",
  };

  const auditValues = {
    [PASSWORD_ACTION.SIGNUP]: {
      email: user.email,
      emailVerified: true,
      action: "User signup completed",
    },
    [PASSWORD_ACTION.SET_PASSWORD]: {
      action: "Password set for existing account",
    },
    [PASSWORD_ACTION.RESET_PASSWORD]: {
      action: "Password reset completed",
    },
  };

  await createAuditLog({
    userId: user.id,
    action: auditActions[action],
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
    newValue: auditValues[action],
  });
};
