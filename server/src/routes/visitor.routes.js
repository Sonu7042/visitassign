const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  setBlacklist,
} = require('../controllers/visitor.controller');
const {
  createVisitorSchema,
  updateVisitorSchema,
  blacklistSchema,
} = require('../validators/visitor.validator');

const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
]);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Visitors
 *   description: Visitor profile management & search
 */

/**
 * @swagger
 * /visitors:
 *   post:
 *     summary: Register a new visitor (with optional photo & government ID upload)
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Visitor created }
 *   get:
 *     summary: List/search visitors in the current organization
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Visitors fetched }
 */
router.post('/', authorize('admin', 'security', 'employee'), uploadFields, validate(createVisitorSchema), createVisitor);
router.get('/', authorize('admin', 'security', 'employee'), getVisitors);

/**
 * @swagger
 * /visitors/{id}:
 *   get:
 *     summary: Get a visitor by id
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Visitor fetched }
 *   put:
 *     summary: Update a visitor's profile / documents
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Visitor updated }
 *   delete:
 *     summary: Delete a visitor (admin only)
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Visitor deleted }
 */
router.get('/:id', authorize('admin', 'security', 'employee'), getVisitorById);
router.put('/:id', authorize('admin', 'security', 'employee'), uploadFields, validate(updateVisitorSchema), updateVisitor);
router.delete('/:id', authorize('admin'), deleteVisitor);

/**
 * @swagger
 * /visitors/{id}/blacklist:
 *   put:
 *     summary: Blacklist or un-blacklist a visitor
 *     tags: [Visitors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Visitor blacklist status updated }
 */
router.put('/:id/blacklist', authorize('admin', 'security'), validate(blacklistSchema), setBlacklist);

module.exports = router;
