const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getMonthlyAnalytics } = require('../controllers/dashboard.controller');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-aware dashboard statistics
 */

router.use(authenticate);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get role-specific dashboard statistics for the current user
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard stats fetched successfully }
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /dashboard/analytics:
 *   get:
 *     summary: Admin only - visitor/appointment trends for the last 6 months
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Monthly analytics fetched successfully }
 */
router.get('/analytics', authorize('admin'), getMonthlyAnalytics);

module.exports = router;
