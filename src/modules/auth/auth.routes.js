import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';

import { signUpSchema, verifyOtpSchema, setPasswordSchema, loginSchema } from './auth.schema.js';
import { requireAccessToken, verifyPasswordResetToken , verifySignupToken } from '../../middlewares/auth.middleware.js';
import passport from 'passport';

import { verifyOtpController } from "./controllers/otp.controller.js";
import { emailVerifactionOtpController, loginOtpController, forgotPasswordOtpController } from "./controllers/request-otps.controller.js";
import {passwordController, verifyForgotPasswordOtpController} from "./controllers/password.controller.js";
import {loginWithOtpController , loginWithGoogleController , loginWithEmailAndPasswordController , logoutController} from "./controllers/login.controller.js";
const router = Router();








// otp-related routes
router.post("/signup-otp", validate(signUpSchema), emailVerifactionOtpController);
router.post("/login-otp", validate(loginSchema), loginOtpController);
router.post("/forgot-password-otp", validate(signUpSchema), forgotPasswordOtpController);
router.post("/verify-otp-signup", validate(verifyOtpSchema), verifyOtpController);
router.post("/verify-otp-forgot-password", validate(verifyOtpSchema),verifyForgotPasswordOtpController);
router.post("/verify-otp-login", validate(verifyOtpSchema), loginWithOtpController);


// password-related routes
router.post("/set-password", verifySignupToken, validate(setPasswordSchema), passwordController);
router.post("/change-password", requireAccessToken, validate(setPasswordSchema), passwordController);
router.post("/reset-password", verifyPasswordResetToken, validate(setPasswordSchema), passwordController);

// login-related routes
router.post("/login" , validate(loginSchema), loginWithEmailAndPasswordController);
router.post("/login-otp", validate(loginSchema), loginWithOtpController);
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
  loginWithGoogleController
);
// logout route
router.post("/logout", requireAccessToken, logoutController);

export default router;
