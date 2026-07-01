const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getHosts,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Staff user management (admin only, except host lookup)
 */

router.use(authenticate);

/**
 * @swagger
 * /users/hosts:
 *   get:
 *     summary: List employees/admins that can act as appointment hosts
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Hosts fetched successfully }
 */
router.get('/hosts', authorize('admin', 'security', 'employee'), getHosts);

router.use(authorize('admin'));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a staff user (admin/security/employee) in the current organization
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: User created successfully }
 *   get:
 *     summary: List staff users in the current organization
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users fetched successfully }
 */
router.post('/', validate(createUserSchema), createUser);
router.get('/', getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a staff user by id
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User fetched successfully }
 *   put:
 *     summary: Update a staff user (role, status, profile)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User updated successfully }
 *   delete:
 *     summary: Delete a staff user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User deleted successfully }
 */
router.get('/:id', getUserById);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
