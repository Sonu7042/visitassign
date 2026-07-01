require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { initSockets } = require('./src/sockets');
const startCronJobs = require('./src/cron');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSockets(server);

// Make the socket.io instance available to controllers/services via req.app.get('io')
app.set('io', io);

(async () => {
  try {
    await connectDB();
    startCronJobs();

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error('Server startup failed', { message: error.message, stack: error.stack });
    process.exitCode = 1;
  }
})();

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});
