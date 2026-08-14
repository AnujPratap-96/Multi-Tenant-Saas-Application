import { Router } from "express";
import { requireAccessToken } from "../../../middlewares/auth.middleware.js";
import { resolveTenant, requireTenant } from "../../tenant/middleware/tenant.middleware.js";
import { getDashboardStatsController } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

router.get("/", getDashboardStatsController);

export default router;
