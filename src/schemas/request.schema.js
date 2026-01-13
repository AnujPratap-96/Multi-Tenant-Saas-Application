// validators/request.schema.js
import { z } from "zod";

export const requestSchema = ({
  body,
  params,
  query,
}) =>
  z.object({
    body: body ?? z.any(),
    params: params ?? z.any(),
    query: query ?? z.any(),
  });
