const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { notifyEmail, notifyInApp } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');
const { logAction } = require('../services/auditLog.service');

const POPULATE = [
  { path: 'visitorId' },
  { path: 'hostId', select: 'name email phone role' },
];

const createAppointment = catchAsync(async (req, res) => {
  const { visitorId, hostId, purpose, visitDate, expectedCheckIn, expectedCheckOut, notes } = req.body;

  const visitor = await Visitor.findOne({ _id: visitorId, organizationId: req.user.organizationId });
  if (!visitor) throw ApiError.notFound('Visitor not found');
  if (visitor.isBlacklisted) throw ApiError.forbidden('This visitor is blacklisted and cannot be scheduled');

  const host = await User.findOne({
    _id: hostId,
    organizationId: req.user.organizationId,
    role: { $in: ['employee', 'admin'] },
  });
  if (!host) throw ApiError.notFound('Host not found');

  const appointment = await Appointment.create({
    visitorId,
    hostId,
    organizationId: req.user.organizationId,
    purpose,
    visitDate,
    expectedCheckIn,
    expectedCheckOut,
    notes,
  });

  await notifyInApp({
    recipientUser: host,
    title: 'New appointment request',
    message: `${visitor.fullName} requested a visit on ${new Date(visitDate).toLocaleDateString()}.`,
    meta: { appointmentId: appointment._id.toString() },
  });

  await logAction({
    actor: req.user._id,
    action: 'create',
    entity: 'Appointment',
    entityId: appointment._id,
    organizationId: req.user.organizationId,
  });

  const populated = await appointment.populate(POPULATE);
  return new ApiResponse(201, 'Appointment created successfully', { appointment: populated }).send(res);
});

// Public endpoint: visitors register themselves + request an appointment
const selfRegister = catchAsync(async (req, res) => {
  const {
    organizationId, fullName, email, phone, company, address,
    hostId, purpose, visitDate, expectedCheckIn, expectedCheckOut, notes,
  } = req.body;

  const organization = await Organization.findById(organizationId);
  if (!organization) throw ApiError.badRequest('Invalid organization');

  const host = await User.findOne({
    _id: hostId,
    organizationId,
    role: { $in: ['employee', 'admin'] },
  });
  if (!host) throw ApiError.notFound('Host not found');

  let visitor = await Visitor.findOne({ email, organizationId });
  if (!visitor) {
    visitor = await Visitor.create({ fullName, email, phone, company, address, organizationId });
  }

  if (visitor.isBlacklisted) {
    throw ApiError.forbidden('You are not permitted to schedule a visit. Please contact the organization.');
  }

  const appointment = await Appointment.create({
    visitorId: visitor._id,
    hostId,
    organizationId,
    purpose,
    visitDate,
    expectedCheckIn,
    expectedCheckOut,
    notes,
  });

  await notifyInApp({
    recipientUser: host,
    title: 'New visitor appointment request',
    message: `${visitor.fullName} requested a visit on ${new Date(visitDate).toLocaleDateString()}.`,
    meta: { appointmentId: appointment._id.toString() },
  });

  const populated = await appointment.populate(POPULATE);
  return new ApiResponse(201, 'Appointment request submitted successfully', { appointment: populated }).send(res);
});

const getAppointments = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20, from, to } = req.query;
  const filter = { organizationId: req.user.organizationId };

  if (req.user.role === 'employee') filter.hostId = req.user._id;
  if (req.user.role === 'visitor') {
    if (!req.user.visitorId) {
      return new ApiResponse(200, 'Appointments fetched successfully', { appointments: [] }, { total: 0 }).send(res);
    }
    filter.visitorId = req.user.visitorId;
  }

  if (status) filter.status = status;
  if (from || to) {
    filter.visitDate = {};
    if (from) filter.visitDate.$gte = new Date(from);
    if (to) filter.visitDate.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [appointments, total] = await Promise.all([
    Appointment.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  return new ApiResponse(200, 'Appointments fetched successfully', { appointments }, {
    total,
    page: Number(page),
    limit: Number(limit),
  }).send(res);
});

const getAppointmentById = catchAsync(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  }).populate(POPULATE);

  if (!appointment) throw ApiError.notFound('Appointment not found');

  if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only view your own appointments');
  }
  if (req.user.role === 'visitor' && appointment.visitorId._id.toString() !== String(req.user.visitorId)) {
    throw ApiError.forbidden('You can only view your own appointments');
  }

  return new ApiResponse(200, 'Appointment fetched successfully', { appointment }).send(res);
});

const notifyVisitorOfDecision = async (appointment, title, message) => {
  const visitorUser = await User.findOne({ visitorId: appointment.visitorId._id });
  if (visitorUser) {
    await notifyEmail({ recipientUser: visitorUser, title, message });
  } else {
    await sendEmail({ to: appointment.visitorId.email, subject: title, html: `<p>${message}</p>` });
  }
};

const approveAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  }).populate(POPULATE);

  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only approve your own appointments');
  }
  if (appointment.status !== 'pending') {
    throw ApiError.badRequest(`Appointment is already ${appointment.status}`);
  }

  appointment.status = 'approved';
  if (req.body.notes) appointment.notes = req.body.notes;
  await appointment.save();

  await notifyVisitorOfDecision(
    appointment,
    'Appointment approved',
    `Your visit request for ${new Date(appointment.visitDate).toLocaleDateString()} has been approved. A pass will be generated for your visit.`
  );

  await logAction({
    actor: req.user._id,
    action: 'approve',
    entity: 'Appointment',
    entityId: appointment._id,
    organizationId: req.user.organizationId,
  });

  return new ApiResponse(200, 'Appointment approved successfully', { appointment }).send(res);
});

const rejectAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  }).populate(POPULATE);

  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only reject your own appointments');
  }
  if (appointment.status !== 'pending') {
    throw ApiError.badRequest(`Appointment is already ${appointment.status}`);
  }

  appointment.status = 'rejected';
  if (req.body.notes) appointment.notes = req.body.notes;
  await appointment.save();

  await notifyVisitorOfDecision(
    appointment,
    'Appointment rejected',
    `Unfortunately, your visit request for ${new Date(appointment.visitDate).toLocaleDateString()} was rejected.${
      req.body.notes ? ` Reason: ${req.body.notes}` : ''
    }`
  );

  await logAction({
    actor: req.user._id,
    action: 'reject',
    entity: 'Appointment',
    entityId: appointment._id,
    organizationId: req.user.organizationId,
  });

  return new ApiResponse(200, 'Appointment rejected successfully', { appointment }).send(res);
});

module.exports = {
  createAppointment,
  selfRegister,
  getAppointments,
  getAppointmentById,
  approveAppointment,
  rejectAppointment,
};
