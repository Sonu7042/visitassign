const mongoose = require('mongoose');
const logger = require('../utils/logger');

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Non-fatal by design: if MONGODB_URI is missing/unreachable the API still
// boots (useful for builds/health checks), but DB-backed routes will fail
// until a valid connection string is provided.
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn('MONGODB_URI not set - skipping database connection.');
    return;
  }

  try {
    await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
  }
};

module.exports = connectDB;
