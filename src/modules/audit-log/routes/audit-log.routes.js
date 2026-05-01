// Audit log routes - API endpoints for viewing audit logs
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import { listAuditLogsSchema } from '../schemas/audit-log.schema.js';
import { listAuditLogsController } from '../controllers/audit-log.controller.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// List audit logs (Restricted to admins in service)
router.get('/', validate(listAuditLogsSchema), listAuditLogsController);

export default router;
