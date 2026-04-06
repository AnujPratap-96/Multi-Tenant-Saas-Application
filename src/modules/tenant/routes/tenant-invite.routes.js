// Tenant invite routes - API endpoints for invite operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import {
  createInviteSchema,
  inviteParamsSchema,
  listInvitesQuerySchema,
  acceptInviteSchema,
  rejectInviteSchema,
} from '../schemas/tenant-invite.schema.js';
import {
  createInviteController,
  listInvitesController,
  cancelInviteController,
  resendInviteController,
  acceptInviteController,
  rejectInviteController,
} from '../controllers/tenant-invite.controller.js';

const router = Router();

// All routes require authentication (except accept/reject which need special handling)
router.use(requireAccessToken);

// List invites for a tenant
router.get('/:id/invites', validate(listInvitesQuerySchema), listInvitesController);

// Create an invite
router.post('/:id/invites', validate(createInviteSchema), createInviteController);

// Cancel an invite
router.delete('/:id/invites/:inviteId', validate(inviteParamsSchema), cancelInviteController);

// Resend an invite
router.post('/:id/invites/:inviteId/resend', validate(inviteParamsSchema), resendInviteController);

// Accept an invite (public - requires authentication but not tenant context)
router.post('/invites/accept', validate(acceptInviteSchema), acceptInviteController);

// Reject an invite (public - requires authentication but not tenant context)
router.post('/invites/reject', validate(rejectInviteSchema), rejectInviteController);

export default router;
