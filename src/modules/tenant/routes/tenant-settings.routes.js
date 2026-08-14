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
/**
 * @swagger
 * /tenants/{id}/settings:
 *   get:
 *     summary: Get tenant settings (admin only)
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant settings
 */
router.get('/:id/settings', validate(settingsParamsSchema), getSettingsController);

// Update settings
/**
 * @swagger
 * /tenants/{id}/settings:
 *   patch:
 *     summary: Merge-update tenant settings (admin only)
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingsUpdate'
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch('/:id/settings', validate(settingsParamsSchema), validate(updateSettingsSchema), updateSettingsController);

// Delete settings
/**
 * @swagger
 * /tenants/{id}/settings:
 *   delete:
 *     summary: Delete tenant settings (admin only)
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Settings deleted
 */
router.delete('/:id/settings', validate(settingsParamsSchema), deleteSettingsController);

export default router;
