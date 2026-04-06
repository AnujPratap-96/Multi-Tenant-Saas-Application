// Tenant membership routes - API endpoints for membership operations
import { Router } from 'express';
import { validate } from '../../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../../middlewares/auth.middleware.js';
import {
  addMemberSchema,
  updateMemberSchema,
  memberParamsSchema,
  listMembersQuerySchema,
  suspendMemberSchema,
} from '../schemas/tenant-membership.schema.js';
import {
  addMemberController,
  updateMemberController,
  removeMemberController,
  suspendMemberController,
  restoreMemberController,
  listMembersController,
  getMemberController,
} from '../controllers/tenant-membership.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAccessToken);

// List members of a tenant
router.get('/:id/members', validate(listMembersQuerySchema), listMembersController);

// Get member details
router.get('/:id/members/:userId', validate(memberParamsSchema), getMemberController);

// Add member to tenant
router.post('/:id/members', validate(addMemberSchema), addMemberController);

// Update member role
router.patch('/:id/members/:userId', validate(memberParamsSchema), validate(updateMemberSchema), updateMemberController);

// Remove member from tenant
router.delete('/:id/members/:userId', validate(memberParamsSchema), removeMemberController);

// Suspend member
router.post('/:id/members/:userId/suspend', validate(suspendMemberSchema), suspendMemberController);

// Restore suspended member
router.post('/:id/members/:userId/restore', validate(memberParamsSchema), restoreMemberController);

export default router;
