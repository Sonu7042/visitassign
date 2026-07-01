const crypto = require('crypto');
const Pass = require('../models/Pass');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ApiError = require('../utils/ApiError');
const { generateQrDataUrl, generateQrBuffer } = require('./qrcode.service');
const { generatePassPdfBuffer } = require('./pdf.service');
const { uploadBuffer } = require('./upload.service');
const { notifyInApp } = require('./notification.service');
const { sendEmail } = require('./email.service');

const generatePassNumber = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VP-${ymd}-${random}`;
};

// Generates a unique pass (number + QR + PDF badge) for an approved
// appointment, uploads artifacts to Cloudinary (if configured), and notifies
// the visitor (email) and host (in-app).
const generatePassForAppointment = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('visitorId')
    .populate('hostId');

  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (appointment.status !== 'approved') {
    throw ApiError.badRequest('Appointment must be approved before generating a pass');
  }

  const existing = await Pass.findOne({ appointmentId });
  if (existing) throw ApiError.conflict('A pass has already been generated for this appointment');

  const passNumber = generatePassNumber();
  let pass = await Pass.create({ appointmentId, passNumber, status: 'active', generatedAt: new Date() });

  const qrDataUrl = await generateQrDataUrl(pass._id);
  const qrBuffer = await generateQrBuffer(pass._id);

  let qrCodeUrl = qrDataUrl;
  const qrUpload = await uploadBuffer(qrBuffer, {
    folder: 'visitor-pass/qrcodes',
    public_id: `qr-${pass.passNumber}`,
  });
  if (qrUpload) qrCodeUrl = qrUpload.secure_url;

  const visitor = appointment.visitorId;
  const host = appointment.hostId;
  const organization = await Organization.findById(appointment.organizationId);

  const pdfBuffer = await generatePassPdfBuffer({
    organizationName: organization?.organizationName,
    visitor,
    host,
    appointment,
    pass,
    qrBuffer,
  });

  let pdfUrl = null;
  const pdfUpload = await uploadBuffer(pdfBuffer, {
    folder: 'visitor-pass/badges',
    resource_type: 'raw',
    public_id: `pass-${pass.passNumber}.pdf`,
  });
  if (pdfUpload) pdfUrl = pdfUpload.secure_url;

  pass.qrCode = qrCodeUrl;
  pass.pdfUrl = pdfUrl;
  await pass.save();

  const visitorUser = await User.findOne({ visitorId: visitor._id });
  for (const recipient of [visitorUser, host].filter(Boolean)) {
    await notifyInApp({
      recipientUser: recipient,
      title: 'Visitor pass generated',
      message: `Pass ${pass.passNumber} has been generated for ${visitor.fullName}.`,
      meta: { passId: pass._id.toString() },
    });
  }

  await sendEmail({
    to: visitor.email,
    subject: `Your Visitor Pass - ${pass.passNumber}`,
    html: `
      <p>Hello ${visitor.fullName},</p>
      <p>Your visitor pass <b>${pass.passNumber}</b> has been generated for your visit on
      ${new Date(appointment.visitDate).toLocaleDateString()}.</p>
      ${pdfUrl ? `<p><a href="${pdfUrl}">Download your pass PDF</a></p>` : ''}
      <p><img src="${qrCodeUrl}" alt="QR Code" /></p>
      <p>Please present this QR code at the gate for check-in.</p>
    `,
    attachments: pdfUrl ? undefined : [{ filename: `${pass.passNumber}.pdf`, content: pdfBuffer }],
  });

  return pass;
};

module.exports = { generatePassForAppointment, generatePassNumber };
