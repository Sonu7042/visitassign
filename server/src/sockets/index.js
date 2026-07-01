const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { allowedOrigins } = require('../config/cors');
const { verifyAccessToken } = require('../services/auth.service');

let ioInstance = null;

const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Authenticate the socket handshake using the same JWT access token used for the REST API
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { sub, role, organizationId } = socket.user || {};
    logger.info(`Socket connected: ${socket.id} (user: ${sub}, role: ${role})`);

    // Join personal, role, and organization rooms so events can be targeted
    if (sub) socket.join(`user:${sub}`);
    if (role) socket.join(`role:${role}`);
    if (organizationId) socket.join(`org:${organizationId}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

// Lets services (outside the request/response cycle) emit events without
// needing the Express app instance.
const getIO = () => ioInstance;

module.exports = { initSockets, getIO };
