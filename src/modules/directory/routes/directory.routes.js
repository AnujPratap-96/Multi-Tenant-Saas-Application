import { Router } from "express";
import { validate } from "../../../middlewares/validate.middleware.js";
import { requireAccessToken } from "../../../middlewares/auth.middleware.js";
import { resolveTenant, requireTenant } from "../../tenant/middleware/tenant.middleware.js";
import { directoryQuerySchema } from "../schemas/directory.schema.js";
import { listDirectoryController } from "../controllers/directory.controller.js";

const router = Router();

// Org-wide people directory: any active tenant member may search all members.
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

router.get("/", validate(directoryQuerySchema), listDirectoryController);

export default router;
