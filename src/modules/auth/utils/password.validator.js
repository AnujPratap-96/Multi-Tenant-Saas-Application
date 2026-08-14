import { ApiError } from "../../../utils/api-error.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";
import { comparePassword } from "../utils/password.domain.js";

export const validatePasswordAction = async ({
  action,
  existingUser,
  oldPassword
}) => {
  if (!Object.values(PASSWORD_ACTION).includes(action)) {
    throw new ApiError(400, `Invalid password action: ${action}`);
  }

  switch (action) {
    case PASSWORD_ACTION.SIGNUP:
      if (existingUser) {
        throw new ApiError(400, "User with this email already exists");
      }
      break;

    case PASSWORD_ACTION.FORGOT_PASSWORD:
      if (!existingUser) {
        throw new ApiError(404, "User not found");
      }
      break;

    case PASSWORD_ACTION.CHANGE_PASSWORD:
      if (!existingUser) {
        throw new ApiError(404, "User not found");
      }

      if (!existingUser.password) {
        throw new ApiError(400, "This account has no password set. Use Google sign-in or OTP verification instead.");
      }

      if (!oldPassword) {
        throw new ApiError(400, "Old password is required");
      }

      const isMatch = await comparePassword(
        oldPassword,
        existingUser.password
      );

      if (!isMatch) {
        throw new ApiError(401, "Old password is incorrect");
      }

      break;
  }
};
