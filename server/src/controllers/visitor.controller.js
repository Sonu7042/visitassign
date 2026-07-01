const Visitor = require('../models/Visitor');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { uploadBuffer } = require('../services/upload.service');
const { logAction } = require('../services/auditLog.service');

const applyUploads = async (req, target) => {
  if (req.files?.photo?.[0]) {
    const result = await uploadBuffer(req.files.photo[0].buffer, { folder: 'visitor-pass/photos' });
    if (result) target.photo = result.secure_url;
  }
  if (req.files?.governmentId?.[0]) {
    const result = await uploadBuffer(req.files.governmentId[0].buffer, { folder: 'visitor-pass/ids' });
    if (result) target.governmentId = result.secure_url;
  }
};

const createVisitor = catchAsync(async (req, res) => {
  const data = { ...req.body, organizationId: req.user.organizationId };
  await applyUploads(req, data);

  const visitor = await Visitor.create(data);

  await logAction({
    actor: req.user._id,
    action: 'create',
    entity: 'Visitor',
    entityId: visitor._id,
    organizationId: req.user.organizationId,
    details: { fullName: visitor.fullName },
  });

  return new ApiResponse(201, 'Visitor created successfully', { visitor }).send(res);
});

const getVisitors = catchAsync(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { organizationId: req.user.organizationId };

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [visitors, total] = await Promise.all([
    Visitor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Visitor.countDocuments(filter),
  ]);

  return new ApiResponse(200, 'Visitors fetched successfully', { visitors }, {
    total,
    page: Number(page),
    limit: Number(limit),
  }).send(res);
});

const getVisitorById = catchAsync(async (req, res) => {
  const visitor = await Visitor.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!visitor) throw ApiError.notFound('Visitor not found');
  return new ApiResponse(200, 'Visitor fetched successfully', { visitor }).send(res);
});

const updateVisitor = catchAsync(async (req, res) => {
  const visitor = await Visitor.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!visitor) throw ApiError.notFound('Visitor not found');

  Object.assign(visitor, req.body);
  await applyUploads(req, visitor);
  await visitor.save();

  await logAction({
    actor: req.user._id,
    action: 'update',
    entity: 'Visitor',
    entityId: visitor._id,
    organizationId: req.user.organizationId,
  });

  return new ApiResponse(200, 'Visitor updated successfully', { visitor }).send(res);
});

const deleteVisitor = catchAsync(async (req, res) => {
  const visitor = await Visitor.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!visitor) throw ApiError.notFound('Visitor not found');

  await logAction({
    actor: req.user._id,
    action: 'delete',
    entity: 'Visitor',
    entityId: visitor._id,
    organizationId: req.user.organizationId,
  });

  return new ApiResponse(200, 'Visitor deleted successfully').send(res);
});

const setBlacklist = catchAsync(async (req, res) => {
  const visitor = await Visitor.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!visitor) throw ApiError.notFound('Visitor not found');

  visitor.isBlacklisted = req.body.isBlacklisted;
  visitor.blacklistReason = visitor.isBlacklisted ? req.body.blacklistReason : undefined;
  await visitor.save();

  await logAction({
    actor: req.user._id,
    action: visitor.isBlacklisted ? 'blacklist' : 'unblacklist',
    entity: 'Visitor',
    entityId: visitor._id,
    organizationId: req.user.organizationId,
    details: { reason: visitor.blacklistReason },
  });

  return new ApiResponse(200, 'Visitor blacklist status updated', { visitor }).send(res);
});

module.exports = {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  setBlacklist,
};
