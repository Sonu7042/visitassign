const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
} else {
  logger.warn('SMTP credentials not set - emails will be logged instead of sent.');
}

// Sends an email, or logs and no-ops if SMTP isn't configured (e.g. local dev).
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  if (!transporter) {
    logger.info(`[email:skip] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
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
    return { messageId: info.messageId };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return { skipped: true, error: err.message };
  }
};

module.exports = { sendEmail, isEmailConfigured };
