import { Router } from "express";
import { validate } from "../../../middlewares/validate.middleware.js";
import { requireAccessToken } from "../../../middlewares/auth.middleware.js";
import { resolveTenant, requireTenant } from "../../tenant/middleware/tenant.middleware.js";
import {
  listNotificationsSchema,
  markReadSchema,
} from "../schemas/notification.schema.js";
import {
  listNotificationsController,
  markReadController,
  markAllReadController,
  unreadCountController,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// List current user's notifications
router.get("/", validate(listNotificationsSchema), listNotificationsController);

// Unread count
router.get("/unread-count", unreadCountController);

// Mark all as read
router.post("/read-all", markAllReadController);

// Mark a single notification as read
router.patch("/:notificationId/read", validate(markReadSchema), markReadController);

export default router;
