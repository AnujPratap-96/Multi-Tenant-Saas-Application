// validators/auth.schema.js
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

export const signUpSchema = requestSchema({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
