
import bcrypt from "bcrypt";
import { env } from "../../../config/env.js";
import { createUser, updateUserPassword } from "../../users/user.repository.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const executePasswordAction = async ({
  action,
  email,
  hashedPassword,
  existingUser,
}) => {
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
      throw new Error("Invalid password action");
  }
};
