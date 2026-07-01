const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { verifyQrPayload } = require('../services/qrcode.service');
const { notifyInApp } = require('../services/notification.service');
const { logAction } = require('../services/auditLog.service');

const POPULATE = {
  path: 'appointmentId',
  populate: [{ path: 'visitorId' }, { path: 'hostId', select: 'name email phone role' }],
};

const resolvePass = async (qrData, organizationId) => {
  const passId = verifyQrPayload(qrData);
  if (!passId) throw ApiError.badRequest('Invalid or tampered QR code');

  const pass = await Pass.findById(passId).populate(POPULATE);
  if (!pass) throw ApiError.notFound('Pass not found');

  const appointment = pass.appointmentId;
  if (!appointment || appointment.organizationId.toString() !== organizationId.toString()) {
    throw ApiError.notFound('Pass not found');
  }

  return pass;
};

const checkIn = catchAsync(async (req, res) => {
  const { qrData, location } = req.body;
  const pass = await resolvePass(qrData, req.user.organizationId);
  const appointment = pass.appointmentId;
  const visitor = appointment.visitorId;

  if (visitor.isBlacklisted) {
    throw ApiError.forbidden('This visitor is blacklisted and cannot be checked in');
  }

  if (pass.status === 'checked-in') throw ApiError.conflict('Visitor has already been checked in');
  if (pass.status === 'checked-out') throw ApiError.conflict('This pass has already been used and checked out');
  if (pass.status === 'expired') throw ApiError.conflict('This pass has expired');
  if (pass.status !== 'active') throw ApiError.conflict(`Pass cannot be checked in (status: ${pass.status})`);

  // Extension point: a live webcam capture could be compared against
  // visitor.photo here for face verification before allowing check-in.
  // Out of scope for this build.

  pass.status = 'checked-in';
  await pass.save();

  const checkLog = await CheckLog.create({
    passId: pass._id,
    scanType: 'check-in',
    scannedBy: req.user._id,
    location: location || 'Main Gate',
  });

  await notifyInApp({
    recipientUser: appointment.hostId,
    title: 'Visitor checked in',
    message: `${visitor.fullName} has checked in for your appointment.`,
    meta: { passId: pass._id.toString() },
  });

  await logAction({
    actor: req.user._id,
    action: 'check-in',
    entity: 'Pass',
    entityId: pass._id,
    organizationId: req.user.organizationId,
    details: { location },
  });

  return new ApiResponse(200, 'Visitor checked in successfully', { pass, checkLog }).send(res);
});

const checkOut = catchAsync(async (req, res) => {
  const { qrData, location } = req.body;
  const pass = await resolvePass(qrData, req.user.organizationId);
  const appointment = pass.appointmentId;
  const visitor = appointment.visitorId;

  if (pass.status !== 'checked-in') {
    throw ApiError.conflict(`Visitor must be checked in before checking out (current status: ${pass.status})`);
  }

  pass.status = 'checked-out';
  await pass.save();

  appointment.status = 'completed';
  await appointment.save();

  const checkLog = await CheckLog.create({
    passId: pass._id,
    scanType: 'check-out',
    scannedBy: req.user._id,
    location: location || 'Main Gate',
  });

  await notifyInApp({
    recipientUser: appointment.hostId,
    title: 'Visitor checked out',
    message: `${visitor.fullName} has checked out.`,
    meta: { passId: pass._id.toString() },
  });

  await logAction({
    actor: req.user._id,
    action: 'check-out',
    entity: 'Pass',
    entityId: pass._id,
    organizationId: req.user.organizationId,
    details: { location },
  });

  return new ApiResponse(200, 'Visitor checked out successfully', { pass, checkLog }).send(res);
});

module.exports = { checkIn, checkOut };
