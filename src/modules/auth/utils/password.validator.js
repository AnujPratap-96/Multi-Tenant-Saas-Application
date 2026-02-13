// src/modules/auth/utils/password.validator.js

import { ApiError } from "../../../utils/api-error.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";

export const validatePasswordAction = (action, existingUser) => {
  if (!Object.values(PASSWORD_ACTION).includes(action)) {
    throw new ApiError(400, `Invalid password action: ${action}`);
  }

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
        throw new ApiError(
          400,
          "Password already set. Use reset password instead."
        );
      }
      break;

    case PASSWORD_ACTION.RESET_PASSWORD:
      if (!existingUser) {
        throw new ApiError(404, "User not found");
      }
      break;
  }
};
