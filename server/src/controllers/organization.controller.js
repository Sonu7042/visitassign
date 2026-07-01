const Organization = require('../models/Organization');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { uploadBuffer } = require('../services/upload.service');
const { logAction } = require('../services/auditLog.service');

const getMyOrganization = catchAsync(async (req, res) => {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) throw ApiError.notFound('Organization not found');
  return new ApiResponse(200, 'Organization fetched successfully', { organization }).send(res);
});

const updateMyOrganization = catchAsync(async (req, res) => {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) throw ApiError.notFound('Organization not found');

  Object.assign(organization, req.body);

  if (req.file) {
    const result = await uploadBuffer(req.file.buffer, { folder: 'visitor-pass/logos' });
    if (result) organization.logo = result.secure_url;
  }

  await organization.save();

  await logAction({
    actor: req.user._id,
    action: 'update',
    entity: 'Organization',
    entityId: organization._id,
    organizationId: organization._id,
  });

  return new ApiResponse(200, 'Organization updated successfully', { organization }).send(res);
});

// Public endpoint used by the visitor self-registration form to populate the host dropdown
const getOrganizationHosts = catchAsync(async (req, res) => {
  const organization = await Organization.findById(req.params.id);
  if (!organization) throw ApiError.notFound('Organization not found');

  const hosts = await User.find({
    organizationId: organization._id,
    role: { $in: ['employee', 'admin'] },
    isActive: true,
  }).select('name email');

  return new ApiResponse(200, 'Hosts fetched successfully', {
    organization: { _id: organization._id, organizationName: organization.organizationName },
    hosts,
  }).send(res);
});

module.exports = { getMyOrganization, updateMyOrganization, getOrganizationHosts };
