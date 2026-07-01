const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
} else {
  logger.warn('SMTP credentials not set - emails will be logged instead of sent.');
}

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  if (!to) {
    throw ApiError.badRequest('Email recipient is required');
  }

  if (!transporter) {
    throw ApiError.serviceUnavailable('Email delivery is not configured');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
      attachments,
    });
    logger.info('Email delivered', { to, messageId: info.messageId });
    return { sent: true, messageId: info.messageId, accepted: info.accepted };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw ApiError.serviceUnavailable('Email delivery failed. Please try again later.');
  }
};

const verifyEmailConnection = async () => {
  if (!transporter) return false;
  await transporter.verify();
  return true;
};

module.exports = { sendEmail, isEmailConfigured, verifyEmailConnection };
