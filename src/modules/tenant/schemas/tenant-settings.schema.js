// Tenant settings schema validation
import { z } from "zod";
import {requestSchema} from "../../../schemas/request.schema.js";

// Update settings schema
export const updateSettingsSchema = requestSchema({
  body: z.object({
    settings: z.record(z.any()).optional(),
  }),
});

// Settings params schema
export const settingsParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
  }),
});
