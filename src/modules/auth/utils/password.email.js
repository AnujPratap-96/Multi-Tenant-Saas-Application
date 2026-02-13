// src/modules/auth/utils/password.email.js

import { sendEmail } from "../../../services/email.service.js";
import {
  welcomeTemplate,
  passwordSetTemplate,
  passwordChangedTemplate,
} from "../../../templates/welcome.template.js";
import { PASSWORD_ACTION } from "../constants/password.constants.js";

export const sendPasswordActionEmail = async (action, email) => {
  const templates = {
    [PASSWORD_ACTION.SIGNUP]: welcomeTemplate,
    [PASSWORD_ACTION.SET_PASSWORD]: passwordSetTemplate,
    [PASSWORD_ACTION.RESET_PASSWORD]: passwordChangedTemplate,
  };

  const template = templates[action];
  if (template) {
    await sendEmail(email, template());
  }
};
