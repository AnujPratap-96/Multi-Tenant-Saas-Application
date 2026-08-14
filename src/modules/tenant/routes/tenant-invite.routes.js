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
/**
 * @swagger
 * /tenants/{id}/invites:
 *   get:
 *     summary: List tenant invites (admin only)
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of invites
 */
router.get('/:id/invites', validate(listInvitesQuerySchema), listInvitesController);

// Create an invite
/**
 * @swagger
 * /tenants/{id}/invites:
 *   post:
 *     summary: Invite a user to the tenant (admin only)
 *     description: Re-invites cancel the previous pending invite (D-7). The token is sent by email and never returned (S-17).
 *     tags: [Invites]
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
 *             $ref: '#/components/schemas/InviteCreate'
 *     responses:
 *       201:
 *         description: Invite created
 */
router.post('/:id/invites', validate(createInviteSchema), createInviteController);

// Cancel an invite
/**
 * @swagger
 * /tenants/{id}/invites/{inviteId}:
 *   delete:
 *     summary: Cancel a pending invite (admin only)
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invite cancelled
 */
router.delete('/:id/invites/:inviteId', validate(inviteParamsSchema), cancelInviteController);

// Resend an invite
/**
 * @swagger
 * /tenants/{id}/invites/{inviteId}/resend:
 *   post:
 *     summary: Resend a pending invite (admin only)
 *     description: Rotates the invite token; the new token is sent by email and never returned (S-17).
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invite resent
 */
router.post('/:id/invites/:inviteId/resend', validate(inviteParamsSchema), resendInviteController);

// Accept an invite (public - requires authentication but not tenant context)
/**
 * @swagger
 * /tenants/invites/accept:
 *   post:
 *     summary: Accept an invite with its token
 *     description: The token must match the authenticated user's email (D-7).
 *     tags: [Invites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteAccept'
 *     responses:
 *       200:
 *         description: Invite accepted
 */
router.post('/invites/accept', validate(acceptInviteSchema), acceptInviteController);

// Reject an invite (public - requires authentication but not tenant context)
/**
 * @swagger
 * /tenants/invites/reject:
 *   post:
 *     summary: Reject an invite with its token
 *     tags: [Invites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteReject'
 *     responses:
 *       200:
 *         description: Invite rejected
 */
router.post('/invites/reject', validate(rejectInviteSchema), rejectInviteController);

export default router;
