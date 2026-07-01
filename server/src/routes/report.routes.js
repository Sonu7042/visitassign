const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const {
  getVisitorsReport,
  getAppointmentsReport,
  getCheckLogsReport,
} = require('../controllers/report.controller');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Exportable reports (JSON / CSV)
 */

router.use(authenticate, authorize('admin', 'security'));

/**
 * @swagger
 * /reports/visitors:
 *   get:
 *     summary: Visitors report (supports CSV export via ?format=csv)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Visitors report fetched successfully }
 */
router.get('/visitors', getVisitorsReport);

/**
 * @swagger
 * /reports/appointments:
 *   get:
 *     summary: Appointments report (supports CSV export via ?format=csv)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointments report fetched successfully }
 */
router.get('/appointments', getAppointmentsReport);

/**
 * @swagger
 * /reports/check-logs:
 *   get:
 *     summary: Check-in/out logs report (supports CSV export via ?format=csv)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Check logs report fetched successfully }
 */
router.get('/check-logs', getCheckLogsReport);

module.exports = router;
