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
import auditLogRoutes from "./modules/audit-log/routes/audit-log.routes.js";
import tenantRoutes from "./modules/tenant/routes/tenant.routes.js";
import tenantMembershipRoutes from "./modules/tenant/routes/tenant-membership.routes.js";
import tenantInviteRoutes from "./modules/tenant/routes/tenant-invite.routes.js";
import tenantSettingsRoutes from "./modules/tenant/routes/tenant-settings.routes.js";
import projectRoutes from "./modules/projects/routes/project.routes.js";
import rbacRoutes from "./modules/rbac/routes/rbac.routes.js";
import taskRoutes from "./modules/tasks/routes/task.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import passport from "./lib/passport.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import healthRoutes from "./modules/health/routes/health.routes.js";
import { doubleCsrfProtection, generateCsrfToken } from "./middlewares/csrf.middleware.js";
import { successResponse } from "./utils/response.js";



const app = express();


app.use((req, res, next) => {
  req.id = uuid();
  res.setHeader("X-Request-Id", req.id);
  next();
});


app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : true,
    credentials: true,
  })
);

// Stricter rate limiting for auth routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests
  message: "Too many login/signup attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});


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

// Swagger UI
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.use(`${API_PREFIX}/health`, healthRoutes);

// CSRF Token Generation
app.get(`${API_PREFIX}/csrf-token`, (req, res) => {
  const token = generateCsrfToken(req, res);
  return successResponse(res, { data: { token } });
});

// Protect all routes below with CSRF (except for GET/HEAD/OPTIONS as configured in doubleCsrf)
app.use(doubleCsrfProtection);




app.use(`${API_PREFIX}/auth`, authRateLimiter, authRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditLogRoutes);
app.use(`${API_PREFIX}/tenants`, tenantRoutes);
app.use(`${API_PREFIX}/tenants`, tenantMembershipRoutes);
app.use(`${API_PREFIX}/tenants`, tenantInviteRoutes);
app.use(`${API_PREFIX}/tenants`, tenantSettingsRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/rbac`, rbacRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);


app.use(errorMiddleware);

export default app;


