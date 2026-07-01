const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  sendOtp,
  verifyOtp,
} = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} = require('../validators/auth.validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new organization (with its admin) or a staff user under an existing organization
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, security, employee] }
 *               organizationId: { type: string }
 *               organizationName: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful - returns accessToken and sets refreshToken cookie
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Exchange a refresh token for a new access token (rotates the refresh token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 */
router.post('/refresh-token', validate(refreshTokenSchema), refreshTokenHandler);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke the current refresh token and clear the cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send a one-time password to an email address
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/send-otp', authLimiter, validate(sendOtpSchema), sendOtp);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify a one-time password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP verified - returns a short-lived verification token
 */
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);

module.exports = router;
