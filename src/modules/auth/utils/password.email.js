// src/modules/auth/utils/password.email.js

import  sendEmail  from "../../../lib/sendEmail.js";
import {
  welcomeTemplate,
  forgotPasswordTemplate,
  passwordResetTemplate
} from "../../../templates/welcome.template.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";

export const sendPasswordActionEmail = async (action, email) => {
  const templates = {
    [PASSWORD_ACTION.SIGNUP]: welcomeTemplate,
    [PASSWORD_ACTION.FORGOT_PASSWORD]: forgotPasswordTemplate,
    [PASSWORD_ACTION.CHANGE_PASSWORD]: passwordResetTemplate,
  };

  const template = templates[action];
  if (template) {
    await sendEmail(email, template());
  }
};
