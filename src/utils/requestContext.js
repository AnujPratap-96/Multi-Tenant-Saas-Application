// utils/requestContext.js
export const getRequestContext = (req) => {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    null;

  // normalize IPv6 localhost
  if (ip === "::1") ip = "127.0.0.1";

  // normalize IPv4-mapped IPv6
  if (ip?.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return {
    ipAddress: ip,
    userAgent: req.headers["user-agent"] || null,
  };
};
