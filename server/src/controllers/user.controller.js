const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { logAction } = require('../services/auditLog.service');

// Lightweight list used to populate "host" dropdowns when creating appointments
const getHosts = catchAsync(async (req, res) => {
  const hosts = await User.find({
    organizationId: req.user.organizationId,
    role: { $in: ['employee', 'admin'] },
    isActive: true,
  }).select('name email role');

  return new ApiResponse(200, 'Hosts fetched successfully', { hosts }).send(res);
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    organizationId: req.user.organizationId,
  });

  await logAction({
    actor: req.user._id,
    action: 'create',
    entity: 'User',
    entityId: user._id,
    organizationId: req.user.organizationId,
    details: { role },
  });

  return new ApiResponse(201, 'User created successfully', { user }).send(res);
});

const getUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = { organizationId: req.user.organizationId };
  if (role) filter.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return new ApiResponse(200, 'Users fetched successfully', { users }, {
    total,
    page: Number(page),
    limit: Number(limit),
  }).send(res);
});

const getUserById = catchAsync(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!user) throw ApiError.notFound('User not found');
  return new ApiResponse(200, 'User fetched successfully', { user }).send(res);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!user) throw ApiError.notFound('User not found');

  Object.assign(user, req.body);
  await user.save();

  await logAction({
    actor: req.user._id,
    action: 'update',
    entity: 'User',
    entityId: user._id,
    organizationId: req.user.organizationId,
    details: req.body,
  });

  return new ApiResponse(200, 'User updated successfully', { user }).send(res);
});

const deleteUser = catchAsync(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!user) throw ApiError.notFound('User not found');

  await logAction({
    actor: req.user._id,
    action: 'delete',
    entity: 'User',
    entityId: user._id,
    organizationId: req.user.organizationId,
  });

  return new ApiResponse(200, 'User deleted successfully').send(res);
});

module.exports = { getHosts, createUser, getUsers, getUserById, updateUser, deleteUser };
