import {Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import {registerController , verifyEmailController , setPasswordController} from './auth.controller.js';
import { signUpSchema , verifyEmailSchema , setPasswordSchema , loginSchema  } from './auth.schema.js';
import {verifySignupToken , verifyPasswordToken} from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(signUpSchema), registerController);
router.post('/verify-email', verifySignupToken, validate(verifyEmailSchema), verifyEmailController);
router.post('/set-password', verifyPasswordToken, validate(setPasswordSchema), setPasswordController);
router.post("/login", validate(loginSchema), loginController);
export default router;
