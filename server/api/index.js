require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');
const logger = require('../src/utils/logger');
const { allowedOrigins } = require('../src/config/cors');

let dbReady = null;

module.exports = async (req, res) => {
  // CORS preflight never needs MongoDB. Answer it immediately so a cold or
  // temporarily unavailable database cannot turn into a browser CORS error.
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  // Let readiness probes report the actual service state even when MongoDB is
  // unavailable instead of replacing the response with a generic 503.
  if (req.url === '/health' || req.url?.startsWith('/health?')) {
    try {
      if (!dbReady) {
        dbReady = connectDB().catch((error) => {
          dbReady = null;
          throw error;
        });
      }
      await dbReady;
    } catch (error) {
      logger.warn('Health check detected an unavailable database', { message: error.message });
    }
    return app(req, res);
  }

  try {
    if (!dbReady) {
      // The module can be reused across invocations, so reuse the MongoDB
      // connection as well. Reset a rejected promise so a later request can retry.
      dbReady = connectDB().catch((error) => {
        dbReady = null;
        throw error;
      });
    }

    await dbReady;
    return app(req, res);
  } catch (error) {
    logger.error('Request rejected because the database is unavailable', {
      message: error.message,
    });

    if (!res.headersSent) {
      const origin = req.headers.origin?.replace(/\/$/, '');
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Vary', 'Origin');
      }

      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
      });
    }

    return res.end();
  }
};
