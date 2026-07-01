const winston = require('winston');

const logFormat =
  process.env.NODE_ENV === 'production'
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      );

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Serverless filesystems are ephemeral/read-only. Structured stdout logs
    // are collected and retained by Vercel without any filesystem writes.
    new winston.transports.Console(),
  ],
});

// Allows morgan to pipe HTTP access logs through winston
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
