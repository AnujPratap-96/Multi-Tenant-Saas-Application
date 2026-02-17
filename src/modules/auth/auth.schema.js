// validators/auth.schema.js
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

export const signUpSchema = requestSchema({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
});


export const verifyOtpSchema = requestSchema({
  body: z.object({
    otp: z.string().length(6),
  }),
});


export const setPasswordSchema = requestSchema({
  body: z.object({
    password: z.string().min(8).max(128),
  }),
});

export const changePasswordSchema = requestSchema({
  body: z.object({
    old_password: z.string().min(8).max(128),
    new_password: z.string().min(8).max(128),
  }),
});

export const loginSchema = requestSchema({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
  }),
});