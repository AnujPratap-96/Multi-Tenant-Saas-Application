export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    console.log(result)
   
  }

  req.validated = result.data; // safe
  next();
};
