const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createAppointment,
  selfRegister,
  getAppointments,
  getAppointmentById,
  approveAppointment,
  rejectAppointment,
} = require('../controllers/appointment.controller');
const {
  createAppointmentSchema,
  selfRegisterSchema,
  decisionSchema,
} = require('../validators/appointment.validator');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Visitor appointment / invitation management
 */

/**
 * @swagger
 * /appointments/self-register:
 *   post:
 *     summary: Public visitor self-registration - creates a visitor profile (if needed) and an appointment request
 *     tags: [Appointments]
 *     responses:
 *       201: { description: Appointment request submitted successfully }
 */
router.post('/self-register', validate(selfRegisterSchema), selfRegister);

router.use(authenticate);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create an appointment / invitation for a registered visitor
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Appointment created successfully }
 *   get:
 *     summary: List appointments (scoped by role - admin/security see all, employee sees their own, visitor sees theirs)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, completed] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Appointments fetched successfully }
 */
router.post('/', authorize('admin', 'security', 'employee'), validate(createAppointmentSchema), createAppointment);
router.get('/', getAppointments);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get an appointment by id
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointment fetched successfully }
 */
router.get('/:id', getAppointmentById);

/**
 * @swagger
 * /appointments/{id}/approve:
 *   put:
 *     summary: Approve a pending appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointment approved successfully }
 */
router.put('/:id/approve', authorize('admin', 'employee'), validate(decisionSchema), approveAppointment);

/**
 * @swagger
 * /appointments/{id}/reject:
 *   put:
 *     summary: Reject a pending appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Appointment rejected successfully }
 */
router.put('/:id/reject', authorize('admin', 'employee'), validate(decisionSchema), rejectAppointment);

module.exports = router;
