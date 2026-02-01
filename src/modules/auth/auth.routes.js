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

// 🔹 Step 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// 🔹 Step 2: Google redirects here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallbackController
);
export default router;
