import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { setPasswordController, loginController, googleCallbackController, logoutController, forgotPasswordController } from './auth.controller.js';
import { signUpSchema, verifyOtpSchema, setPasswordSchema, loginSchema } from './auth.schema.js';
import { requireAccessToken, verifyPasswordToken } from '../../middlewares/auth.middleware.js';
import passport from 'passport';
import { registerController } from "./controllers/register.controller.js";
import { verifyOtpController } from "./controllers/otp.controller.js";
const router = Router();

router.post('/register', validate(signUpSchema), registerController);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtpController);

router.post('/set-password', verifyPasswordToken, validate(setPasswordSchema), setPasswordController);
router.post("/login", validate(loginSchema), loginController);
router.post("/forgot-password", validate(signUpSchema), forgotPasswordController);

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

router.post("/logout", requireAccessToken, logoutController);
export default router;
