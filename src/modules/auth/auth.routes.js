import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';

import { signUpSchema, verifyOtpSchema, setPasswordSchema, loginSchema,changePasswordSchema } from './auth.schema.js';
import { requireAccessToken, verifyPasswordResetToken , verifySignupToken } from '../../middlewares/auth.middleware.js';
import passport from 'passport';
import { verifyOtpController } from "./controllers/otp.controller.js";
import { emailVerifactionOtpController, loginOtpController, forgotPasswordOtpController } from "./controllers/request-otps.controller.js";
import {passwordController, verifyForgotPasswordOtpController, changePasswordController} from "./controllers/password.controller.js";
import {loginWithOtpController , loginWithGoogleController , loginWithEmailAndPasswordController , logoutController} from "./controllers/login.controller.js";
import { refreshTokensController } from "./controllers/session.controller.js";
const router = Router();


// otp-related routes
router.post("/signup-otp", validate(signUpSchema), emailVerifactionOtpController);
router.post("/login-otp", validate(signUpSchema), loginOtpController);
router.post("/forgot-password-otp", validate(signUpSchema), forgotPasswordOtpController);
router.post("/verify-otp-signup", validate(verifyOtpSchema), verifyOtpController);
router.post("/verify-otp-forgot-password", validate(verifyOtpSchema),verifyForgotPasswordOtpController);
router.post("/verify-otp-login", validate(verifyOtpSchema), loginWithOtpController);


// password-related routes
router.post("/set-password", verifySignupToken, validate(setPasswordSchema), passwordController);
router.post("/change-password", requireAccessToken, validate(changePasswordSchema), changePasswordController);
router.post("/forgot-password", verifyPasswordResetToken, validate(setPasswordSchema), passwordController);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login" , validate(loginSchema), loginWithEmailAndPasswordController);
router.post("/login-otp", validate(loginSchema), loginWithOtpController);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: Rotates the refresh token and issues a new access token.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 */
router.post("/refresh-token", refreshTokensController);

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
