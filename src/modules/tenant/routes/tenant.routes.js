// Tenant routes - API endpoints for tenant operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import {
  createTenantSchema,
  updateTenantSchema,
  tenantParamsSchema,
  listTenantsQuerySchema,
  switchTenantSchema,
} from '../schemas/tenant.schema.js';
import {
  createTenantController,
  getTenantController,
  updateTenantController,
  deleteTenantController,
  restoreTenantController,
  listTenantsController,
  switchTenantController,
  getUserTenantsController,
} from '../controllers/tenant.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAccessToken);

// Create new tenant
router.post('/', validate(createTenantSchema), createTenantController);

// List tenants for current user
router.get('/', validate(listTenantsQuerySchema), listTenantsController);

// Get user's tenant memberships (/my endpoint)
router.get('/my', getUserTenantsController);


// Get tenant by ID
router.get('/:id', validate(tenantParamsSchema), getTenantController);

// Update tenant
router.patch('/:id', validate(tenantParamsSchema), validate(updateTenantSchema), updateTenantController);

// Delete (soft delete) tenant
router.delete('/:id', validate(tenantParamsSchema), deleteTenantController);

// Restore tenant
router.post('/:id/restore', validate(tenantParamsSchema), restoreTenantController);

// Switch tenant
router.post('/:id/switch', validate(switchTenantSchema), switchTenantController);

export default router;
