// utils/requestContext.js
export const getRequestContext = (req) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  const userAgent = req.headers['user-agent'];

  return {
    ipAddress: ip,
    userAgent,
  };
};
