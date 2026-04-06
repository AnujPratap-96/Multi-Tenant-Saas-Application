// Tenant settings routes - API endpoints for settings operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import {
  updateSettingsSchema,
  settingsParamsSchema,
} from '../schemas/tenant-settings.schema.js';
import {
  getSettingsController,
  updateSettingsController,
  deleteSettingsController,
} from '../controllers/tenant-settings.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAccessToken);

// Get settings
router.get('/:id/settings', validate(settingsParamsSchema), getSettingsController);

// Update settings
router.patch('/:id/settings', validate(settingsParamsSchema), validate(updateSettingsSchema), updateSettingsController);

// Delete settings
router.delete('/:id/settings', validate(settingsParamsSchema), deleteSettingsController);

export default router;
