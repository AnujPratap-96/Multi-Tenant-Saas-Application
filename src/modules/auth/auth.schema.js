// validators/auth.schema.js
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

export const signUpSchema = requestSchema({
  body: z.object({
     email: z.string().trim().toLowerCase().email(),
  }),
});


export const verifyEmailSchema = requestSchema({
  body: z.object({
    otp: z.string().length(6),
  }),
});
