export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return next(result.error);
  }

  const { body, params, query } = result.data;

  if (body) req.body = body;
  if (params) Object.assign(req.params, params);
  if (query) req.query = query;

  next();
};
