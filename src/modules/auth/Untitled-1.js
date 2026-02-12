
// Password action types
export const PASSWORD_ACTION = {
  SIGNUP: "SIGNUP",
  SET_PASSWORD: "SET_PASSWORD",
  RESET_PASSWORD: "RESET_PASSWORD",
};

export const passwordService = async ({
  email,
  password,
  action = PASSWORD_ACTION.RESET_PASSWORD,
  ipAddress,
  userAgent,
  options = {},
}) => {
  // Configuration with defaults
  const config = {
    generateTokens: true,
    createSession: true,
    sendEmail: true,
    invalidateOldSessions: action === PASSWORD_ACTION.RESET_PASSWORD,
    ...options,
  };

  // Validate action
  if (!Object.values(PASSWORD_ACTION).includes(action)) {
    throw new ApiError(400, `Invalid password action: ${action}`);
  }

  // Get existing user
  const existingUser = await findUserByEmail(email);

  // Validate based on action
  validateAction(action, existingUser);

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Execute action
  const user = await executeAction(action, {
    email,
    hashedPassword,
    existingUser,
    config,
  });

  // Invalidate old sessions if needed
  if (config.invalidateOldSessions && existingUser) {
    await invalidateUserSessions(user.id);
  }

  // Update last login
  await updateLastLogin(user.id);

  // Generate tokens if needed
  let tokens = null;
  if (config.generateTokens) {
    tokens = await generateAuthToken({
      userId: user.id,
      email: user.email,
    });

    // Create session if needed
    if (config.createSession) {
      await createAuthSession({
        userId: user.id,
        refreshTokenHash: crypto
          .createHash("sha256")
          .update(tokens.refreshToken)
          .digest("hex"),
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
      });
    }
  }

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: getAuditAction(action),
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
    newValue: getAuditValue(action, user),
  });

  // Send email if needed
  if (config.sendEmail) {
    await sendActionEmail(action, email);
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
    },
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
    message: getSuccessMessage(action),
  };
};

// Validate action based on user existence
const validateAction = (action, existingUser) => {
  switch (action) {
    case PASSWORD_ACTION.SIGNUP:
      if (existingUser) {
        throw new ApiError(400, "User with this email already exists");
      }
      break;

    case PASSWORD_ACTION.SET_PASSWORD:
      if (!existingUser) {
        throw new ApiError(404, "User not found");
      }
      if (existingUser.password) {
        throw new ApiError(400, "Password already set. Use reset password instead.");
      }
      break;

    case PASSWORD_ACTION.RESET_PASSWORD:
      if (!existingUser) {
        throw new ApiError(404, "User not found");
      }
      break;

    default:
      throw new ApiError(400, `Invalid action: ${action}`);
  }
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Execute the appropriate action
const executeAction = async (action, { email, hashedPassword, existingUser, config }) => {
  switch (action) {
    case PASSWORD_ACTION.SIGNUP:
      return createUser({
        email,
        password: hashedPassword,
        emailVerified: true,
      });

    case PASSWORD_ACTION.SET_PASSWORD:
    case PASSWORD_ACTION.RESET_PASSWORD:
      return updateUserPassword(existingUser.id, hashedPassword);

    default:
      throw new ApiError(400, `Invalid action: ${action}`);
  }
};

// Get audit action based on password action
const getAuditAction = (action) => {
  const auditActions = {
    [PASSWORD_ACTION.SIGNUP]: "CREATE",
    [PASSWORD_ACTION.SET_PASSWORD]: "UPDATE",
    [PASSWORD_ACTION.RESET_PASSWORD]: "UPDATE",
  };
  return auditActions[action] || "UPDATE";
};

// Get audit value based on action
const getAuditValue = (action, user) => {
  switch (action) {
    case PASSWORD_ACTION.SIGNUP:
      return {
        email: user.email,
        emailVerified: true,
        action: "User signup completed",
      };

    case PASSWORD_ACTION.SET_PASSWORD:
      return {
        action: "Password set for existing account",
      };

    case PASSWORD_ACTION.RESET_PASSWORD:
      return {
        action: "Password reset completed",
      };

    default:
      return { action: "Password updated" };
  }
};

// Send appropriate email based on action
const sendActionEmail = async (action, email) => {
  const emailTemplates = {
    [PASSWORD_ACTION.SIGNUP]: () => welcomeTemplate(),
    [PASSWORD_ACTION.SET_PASSWORD]: () => passwordSetTemplate(),
    [PASSWORD_ACTION.RESET_PASSWORD]: () => passwordChangedTemplate(),
  };

  const template = emailTemplates[action];
  if (template) {
    await sendEmail(email, template());
  }
};

// Get success message based on action
const getSuccessMessage = (action) => {
  const messages = {
    [PASSWORD_ACTION.SIGNUP]: "Account created successfully",
    [PASSWORD_ACTION.SET_PASSWORD]: "Password set successfully",
    [PASSWORD_ACTION.RESET_PASSWORD]: "Password reset successfully",
  };
  return messages[action] || "Password updated successfully";
};