import { Router } from "express";
import { validate } from "../../../middlewares/validate.middleware.js";
import { requireAccessToken } from "../../../middlewares/auth.middleware.js";
import { resolveTenant, requireTenant } from "../../tenant/middleware/tenant.middleware.js";
import {
  createTimeEntrySchema,
  stopTimeEntrySchema,
  listTaskTimeEntriesSchema,
  updateTimeEntrySchema,
  deleteTimeEntrySchema,
  listMyTimeEntriesSchema,
} from "../schemas/time-tracking.schema.js";
import {
  createTimeEntryController,
  stopTimeEntryController,
  updateTimeEntryController,
  deleteTimeEntryController,
  listTaskTimeEntriesController,
  listMyTimeEntriesController,
} from "../controllers/time-tracking.controller.js";

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

router.post(
  "/tasks/:taskId/time-entries",
  validate(createTimeEntrySchema),
  createTimeEntryController
);

router.get(
  "/tasks/:taskId/time-entries",
  validate(listTaskTimeEntriesSchema),
  listTaskTimeEntriesController
);

router.get(
  "/time-entries/mine",
  validate(listMyTimeEntriesSchema),
  listMyTimeEntriesController
);

router.patch(
  "/time-entries/:entryId/stop",
  validate(stopTimeEntrySchema),
  stopTimeEntryController
);

router.patch(
  "/time-entries/:entryId",
  validate(updateTimeEntrySchema),
  updateTimeEntryController
);

router.delete(
  "/time-entries/:entryId",
  validate(deleteTimeEntrySchema),
  deleteTimeEntryController
);

export default router;
