const Notification = require('../models/Notification');
const { sendEmail } = require('./email.service');
const { getIO } = require('../sockets');
const logger = require('../utils/logger');

// Persists a notification and pushes it to the recipient's socket room
// (if they're connected) for real-time UI updates.
const createNotification = async ({ recipient, title, message, type = 'in-app', meta }) => {
  const notification = await Notification.create({ recipient, title, message, type, status: 'pending', meta });

  try {
    const io = getIO();
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', notification);
    }
  } catch (err) {
    logger.warn(`Socket emit failed: ${err.message}`);
  }

  notification.status = 'sent';
  await notification.save();
  return notification;
};

const notifyEmail = async ({ recipientUser, title, message, html, attachments }) => {
  const notification = await Notification.create({
    recipient: recipientUser._id,
    title,
    message,
    type: 'email',
    status: 'pending',
  });

  try {
    const result = await sendEmail({
      to: recipientUser.email,
      subject: title,
      html: html || `<p>${message}</p>`,
      text: message,
      attachments,
    });
    notification.status = 'sent';
    await notification.save();
    return result;
  } catch (error) {
    notification.status = 'failed';
    await notification.save();
    throw error;
  }
};

const notifyInApp = async ({ recipientUser, title, message, meta }) =>
  createNotification({ recipient: recipientUser._id, title, message, type: 'in-app', meta });

module.exports = { createNotification, notifyEmail, notifyInApp };
