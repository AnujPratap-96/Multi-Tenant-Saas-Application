js
import { findUserByEmail } from "../../users/user.repository.js";
import { invalidateUserSessions } from "../repositories/auth.repository.js";
import { updateLastLogin } from "../../users/user.repository.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";
import { validatePasswordAction } from "../utils/password.validator.js";
import { hashPassword, executePasswordAction } from "../utils/password.domain.js";
import { handlePasswordTokens } from "../utils/password.token.js";
import { createPasswordAuditLog } from "../utils/password.audit.js";
import { sendPasswordActionEmail } from "../utils/password.email.js";

export const passwordService = async ({
  email,
  password,
  action = PASSWORD_ACTION.CHANGE_PASSWORD,
  ipAddress,
  userAgent,
  options = {},
}) => {
  const config = {
    generateTokens: true,
    createSession: true,
    sendEmail: true,
    invalidateOldSessions: action === PASSWORD_ACTION.CHANGE_PASSWORD || action === PASSWORD_ACTION.FORGOT_PASSWORD,
    ...options,
  };

  const existingUser = await findUserByEmail(email);

  validatePasswordAction(action, existingUser);

  const hashedPassword = await hashPassword(password);

  const user = await executePasswordAction({
    action,
    email,
    hashedPassword,
    existingUser,
  });

  if (config.invalidateOldSessions && existingUser) {
    await invalidateUserSessions(user.id);
  }
  const tokens = null;
  if (!(action === PASSWORD_ACTION.FORGOT_PASSWORD)) {

      tokens = await handlePasswordTokens({
      user,
      generateTokens: config.generateTokens,
      createSession: config.createSession,
      ipAddress,
      userAgent,
    });
  }

  if (tokens) {
    await updateLastLogin(user.id);
  }

  await createPasswordAuditLog({
    action,
    user,
    ipAddress,
    userAgent,
  });

  if (config.sendEmail) {
    await sendPasswordActionEmail(action, email);
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
    ...(tokens && tokens),
    message: "Password action completed successfully",
  };
};
