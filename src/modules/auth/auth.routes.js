import {Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {register , verifyEmail} from './auth.controller.js';
import { signUpSchema , verifyEmailSchema } from './auth.schema.js';
import {verifySignupToken} from '../../middlewares/auth.middleware.js';




const router = Router();

router.post('/register', validate(signUpSchema), register);
router.post('/verify-email', verifySignupToken, validate(verifyEmailSchema), verifyEmail);
export default router;
