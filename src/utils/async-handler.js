export const asyncHandler = (fn) => {
  console.log('Wrapping function in asyncHandler');
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
