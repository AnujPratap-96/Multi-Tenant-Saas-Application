import pino from "pino";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const isProd = env.NODE_ENV === "production";

// Ensure logs directory exists (early-stage OK)
const logsDir = path.join(process.cwd(), "logs");
if (isProd && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = pino({
  level: isProd ? "info" : "debug",

  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "token",
      "otp"
    ],
    censor: "[REDACTED]"
  },

  transport: !isProd
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname"
        }
      }
    : undefined
},
isProd
  ? pino.destination({
      dest: path.join(logsDir, "app.log"),
      sync: false   // IMPORTANT: non-blocking
    })
  : undefined
);

export default logger;
