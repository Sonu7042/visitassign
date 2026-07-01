const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  getMyOrganization,
  updateMyOrganization,
  getOrganizationHosts,
} = require('../controllers/organization.controller');
const { updateOrganizationSchema } = require('../validators/organization.validator');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Multi-organization support
 */

/**
 * @swagger
 * /organizations/{id}/hosts:
 *   get:
 *     summary: Public - list available hosts (employees/admins) for the visitor self-registration form
 *     tags: [Organizations]
 *     responses:
 *       200: { description: Hosts fetched successfully }
 */
router.get('/:id/hosts', getOrganizationHosts);

router.use(authenticate);

/**
 * @swagger
 * /organizations/me:
 *   get:
 *     summary: Get the current user's organization
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Organization fetched successfully }
 *   put:
 *     summary: Update the current organization (admin only, supports logo upload)
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Organization updated successfully }
 */
router.get('/me', getMyOrganization);
router.put('/me', authorize('admin'), upload.single('logo'), validate(updateOrganizationSchema), updateMyOrganization);

module.exports = router;
