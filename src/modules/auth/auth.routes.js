import {Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {register , verifyEmail , setPassword} from './auth.controller.js';
import { signUpSchema , verifyEmailSchema , setPasswordSchema  } from './auth.schema.js';
import {verifySignupToken , verifyPasswordToken} from '../../middlewares/auth.middleware.js';
import { set } from 'zod';




const router = Router();

router.post('/register', validate(signUpSchema), register);
router.post('/verify-email', verifySignupToken, validate(verifyEmailSchema), verifyEmail);
router.post('/set-password', verifyPasswordToken, validate(setPasswordSchema), setPassword);
export default router;
