import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import { resolveTenant, requireTenant } from '../../tenant/middleware/tenant.middleware.js';
import { requirePermission } from '../../rbac/middleware/rbac.middleware.js';
import { listAuditLogsSchema } from '../schemas/audit-log.schema.js';
import { listAuditLogsController, exportAuditLogsController } from '../controllers/audit-log.controller.js';

const router = Router();

router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

router.get('/', requirePermission('audit', 'view'), validate(listAuditLogsSchema), listAuditLogsController);
router.get('/export', requirePermission('audit', 'view'), validate(listAuditLogsSchema), exportAuditLogsController);

export default router;
