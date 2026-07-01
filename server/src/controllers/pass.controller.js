const Pass = require('../models/Pass');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { generatePassForAppointment } = require('../services/pass.service');
const { sendEmail } = require('../services/email.service');
const { logAction } = require('../services/auditLog.service');

const POPULATE = {
  path: 'appointmentId',
  populate: [{ path: 'visitorId' }, { path: 'hostId', select: 'name email phone role' }],
};

const generatePass = catchAsync(async (req, res) => {
  const { appointmentId } = req.body;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    organizationId: req.user.organizationId,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const pass = await generatePassForAppointment(appointmentId);

  await logAction({
    actor: req.user._id,
    action: 'generate',
    entity: 'Pass',
    entityId: pass._id,
    organizationId: req.user.organizationId,
  });

  const populated = await Pass.findById(pass._id).populate(POPULATE);
  return new ApiResponse(201, 'Pass generated successfully', { pass: populated }).send(res);
});

const getPassById = catchAsync(async (req, res) => {
  const pass = await Pass.findById(req.params.id).populate(POPULATE);
  if (!pass) throw ApiError.notFound('Pass not found');

  const appointment = pass.appointmentId;
  if (!appointment || appointment.organizationId.toString() !== req.user.organizationId.toString()) {
    throw ApiError.notFound('Pass not found');
  }

  if (req.user.role === 'employee' && appointment.hostId._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }
  if (req.user.role === 'visitor' && appointment.visitorId._id.toString() !== String(req.user.visitorId)) {
    throw ApiError.forbidden('Access denied');
  }

  return new ApiResponse(200, 'Pass fetched successfully', { pass }).send(res);
});

const getMyPasses = catchAsync(async (req, res) => {
  if (req.user.role !== 'visitor' || !req.user.visitorId) {
    throw ApiError.forbidden('Only visitors can access this endpoint');
  }

  const appointments = await Appointment.find({ visitorId: req.user.visitorId }).select('_id');
  const appointmentIds = appointments.map((a) => a._id);

  const passes = await Pass.find({ appointmentId: { $in: appointmentIds } })
    .populate(POPULATE)
    .sort({ createdAt: -1 });

  return new ApiResponse(200, 'Passes fetched successfully', { passes }).send(res);
});

const emailPass = catchAsync(async (req, res) => {
  const pass = await Pass.findById(req.params.id).populate(POPULATE);
  if (!pass) throw ApiError.notFound('Pass not found');

  const appointment = pass.appointmentId;
  if (!appointment || appointment.organizationId.toString() !== req.user.organizationId.toString()) {
    throw ApiError.notFound('Pass not found');
  }

  const visitor = appointment.visitorId;
  await sendEmail({
    to: visitor.email,
    subject: `Your Visitor Pass - ${pass.passNumber}`,
    html: `
      <p>Hello ${visitor.fullName},</p>
      <p>Here is your visitor pass <b>${pass.passNumber}</b>.</p>
      ${pass.pdfUrl ? `<p><a href="${pass.pdfUrl}">Download PDF</a></p>` : ''}
      <p><img src="${pass.qrCode}" alt="QR Code" /></p>
    `,
  });

  return new ApiResponse(200, 'Pass emailed successfully').send(res);
});

module.exports = { generatePass, getPassById, getMyPasses, emailPass };
