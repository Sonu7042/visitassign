const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { checkIn, checkOut } = require('../controllers/checkin.controller');
const { scanSchema } = require('../validators/checkin.validator');

router.use(authenticate, authorize('admin', 'security'));

/**
 * @swagger
 * tags:
 *   name: Check-In
 *   description: QR-based visitor check-in / check-out
 */

/**
 * @swagger
 * /checkin:
 *   post:
 *     summary: Scan a visitor's QR code to check them in
 *     tags: [Check-In]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData: { type: string }
 *               location: { type: string }
 *     responses:
 *       200: { description: Visitor checked in successfully }
 */
router.post('/checkin', validate(scanSchema), checkIn);

/**
 * @swagger
 * /checkout:
 *   post:
 *     summary: Scan a visitor's QR code to check them out
 *     tags: [Check-In]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData: { type: string }
 *               location: { type: string }
 *     responses:
 *       200: { description: Visitor checked out successfully }
 */
router.post('/checkout', validate(scanSchema), checkOut);

module.exports = router;
