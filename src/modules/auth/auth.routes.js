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
import { otpSendRateLimiter, otpVerifyRateLimiter } from "../../middlewares/otpRateLimit.middleware.js";
import crypto from "crypto";
import { env } from "../../config/env.js";
const router = Router();


// otp-related routes
/**
 * @swagger
 * /auth/signup-otp:
 *   post:
 *     summary: Request signup OTP
 *     description: Never reveals whether the email exists (D-10). Returns a requestId bound to the OTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUp'
 *     responses:
 *       200:
 *         description: If this email exists, an OTP was sent
 */
router.post("/signup-otp", otpSendRateLimiter, validate(signUpSchema), emailVerifactionOtpController);

/**
 * @swagger
 * /auth/login-otp:
 *   post:
 *     summary: Request login OTP
 *     description: Never reveals whether the email exists (D-10).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUp'
 *     responses:
 *       200:
 *         description: If this email exists, an OTP was sent
 */
router.post("/login-otp", otpSendRateLimiter, validate(signUpSchema), loginOtpController);

/**
 * @swagger
 * /auth/forgot-password-otp:
 *   post:
 *     summary: Request password-reset OTP
 *     description: Never reveals whether the email exists (D-10).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUp'
 *     responses:
 *       200:
 *         description: If this email exists, an OTP was sent
 */
router.post("/forgot-password-otp", otpSendRateLimiter, validate(signUpSchema), forgotPasswordOtpController);

/**
 * @swagger
 * /auth/verify-otp-signup:
 *   post:
 *     summary: Verify signup OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post("/verify-otp-signup", otpVerifyRateLimiter, validate(verifyOtpSchema), verifyOtpController);

/**
 * @swagger
 * /auth/verify-otp-forgot-password:
 *   post:
 *     summary: Verify password-reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post("/verify-otp-forgot-password", otpVerifyRateLimiter, validate(verifyOtpSchema),verifyForgotPasswordOtpController);

/**
 * @swagger
 * /auth/verify-otp-login:
 *   post:
 *     summary: Verify login OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtp'
 *     responses:
 *       200:
 *         description: OTP verified, tokens issued
 */
router.post("/verify-otp-login", otpVerifyRateLimiter, validate(verifyOtpSchema), loginWithOtpController);


// password-related routes
/**
 * @swagger
 * /auth/set-password:
 *   post:
 *     summary: Set password after signup OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetPassword'
 *     responses:
 *       200:
 *         description: Password set
 */
router.post("/set-password", verifySignupToken, validate(setPasswordSchema), passwordController);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for the authenticated user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *     responses:
 *       200:
 *         description: Password changed
 */
router.post("/change-password", requireAccessToken, validate(changePasswordSchema), changePasswordController);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Complete password reset (token from verified OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetPassword'
 *     responses:
 *       200:
 *         description: Password reset
 */
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

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: Rotates the refresh token (read from the httpOnly cookie only, S-19) and issues a new access token.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 */
router.post("/refresh-token", refreshTokensController);

// OAuth state param (S-20): random state bound to the browser via cookie,
// verified on the callback to prevent OAuth login CSRF.
const oauthStateCookie = "oauth_state";

const googleAuthHandler = (req, res, next) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(oauthStateCookie, state, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
  })(req, res, next);
};

const verifyGoogleState = (req, res, next) => {
  if (!req.query.state || req.query.state !== req.cookies?.[oauthStateCookie]) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=oauth`);
  }
  res.clearCookie(oauthStateCookie);
  next();
};

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth login
 *     description: Sets a signed oauth_state cookie and redirects to Google (S-20 CSRF protection).
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get("/google", googleAuthHandler);

// 🔹 Step 2: Google redirects here
/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Verifies the oauth_state cookie, then exchanges the code. On failure redirects to FRONTEND_URL/login?error=oauth.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to FRONTEND_URL (login or error)
 */
router.get(
  "/google/callback",
  verifyGoogleState,
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=oauth`,
  }),
  loginWithGoogleController
);
// logout route
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout — revokes the current refresh token
 *     description: Requires the access token; the refresh token is cleared from the httpOnly cookie and revoked in the DB.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", requireAccessToken, logoutController);

export default router;
