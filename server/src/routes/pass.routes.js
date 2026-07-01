const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { generatePass, getPassById, getMyPasses, emailPass } = require('../controllers/pass.controller');
const { generatePassSchema } = require('../validators/pass.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Passes
 *   description: Visitor pass generation (QR + PDF badge)
 */

/**
 * @swagger
 * /passes/generate:
 *   post:
 *     summary: Generate a visitor pass (QR code + PDF badge) for an approved appointment
 *     tags: [Passes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Pass generated successfully }
 */
router.post('/generate', authorize('admin', 'security', 'employee'), validate(generatePassSchema), generatePass);

/**
 * @swagger
 * /passes/my:
 *   get:
 *     summary: Get the authenticated visitor's own passes
 *     tags: [Passes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Passes fetched successfully }
 */
router.get('/my', authorize('visitor'), getMyPasses);

/**
 * @swagger
 * /passes/{id}:
 *   get:
 *     summary: Get a pass by id
 *     tags: [Passes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pass fetched successfully }
 */
router.get('/:id', getPassById);

/**
 * @swagger
 * /passes/{id}/email:
 *   post:
 *     summary: Re-send the pass PDF/QR code to the visitor's email
 *     tags: [Passes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pass emailed successfully }
 */
router.post('/:id/email', authorize('admin', 'security', 'employee'), emailPass);

module.exports = router;
