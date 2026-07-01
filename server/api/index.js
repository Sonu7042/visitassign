require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');
const logger = require('../src/utils/logger');

let dbReady = null;

module.exports = async (req, res) => {
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
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
      });
    }

    return res.end();
  }
};
