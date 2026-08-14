// utils/requestContext.js (D-15: use req.ip — honors `trust proxy`, no header spoofing)
export const getRequestContext = (req) => {
  let ip = req.ip || req.socket.remoteAddress || null;

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
