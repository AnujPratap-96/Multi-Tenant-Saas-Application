import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import requestLogger from "./middlewares/requestLogger.middleware.js";
import { API_PREFIX } from "./config/version.js";
import authRoutes from "./modules/auth/auth.routes.js";
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
app.use(express.json());
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
app.use(cookieParser());

/* ------------------ Request Logging ------------------ */
app.use(requestLogger);
/* ------------------ Routes ------------------ */
console.log(`Mounting auth routes at ${API_PREFIX}/auth`);
app.use(`${API_PREFIX}/auth`, authRoutes);

/* ------------------ Error Handler (LAST) ------------------ */
app.use(errorMiddleware);

export default app;
