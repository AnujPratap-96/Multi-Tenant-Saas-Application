// User routes - API endpoints for user operations
import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAccessToken } from '../../middlewares/auth.middleware.js';
import {
  updateProfileSchema,
  userParamsSchema,
} from './user.schema.js';
import {
  getMyProfileController,
  updateMyProfileController,
  getUserByIdController,
} from './user.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAccessToken);

// Current user profile routes
router.get('/me', getMyProfileController);
router.patch('/me', validate(updateProfileSchema), updateMyProfileController);

// Specific user profile routes
router.get('/:id', validate(userParamsSchema), getUserByIdController);

export default router;
