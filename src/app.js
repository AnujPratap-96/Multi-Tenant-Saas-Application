import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import requestLogger from "./middlewares/requestLogger.middleware.js";
import { API_PREFIX } from "./config/version.js";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import passport from "./lib/passport.js";


const app = express();


app.use((req, res, next) => {
  req.id = uuid();
  res.setHeader("X-Request-Id", req.id);
  next();
});


app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(cookieParser());


app.use(requestLogger);
app.use(passport.initialize());



app.use(`${API_PREFIX}/auth`, authRoutes);


app.use(errorMiddleware);

export default app;
