import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";

import logger from "./lib/logger.js";
import { env } from "./config/env.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import routes from "./routes.js";
import requestLogger from "./middlewares/requestLogger.middleware.js";

const app = express();

/* ------------------ Request ID ------------------ */
app.use((req, res, next) => {
  req.id = uuid();
  res.setHeader("X-Request-Id", req.id);
  next();
});

/* ------------------ Security ------------------ */
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ------------------ Body Parsing ------------------ */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ------------------ Rate Limiting ------------------ */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ------------------ Request Logging ------------------ */
app.use(requestLogger);
/* ------------------ Routes ------------------ */
app.use("/api", routes);

/* ------------------ Error Handler (LAST) ------------------ */
app.use(errorMiddleware);

export default app;
