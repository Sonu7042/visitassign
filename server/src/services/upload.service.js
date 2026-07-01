const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const logger = require('../utils/logger');

// Uploads a buffer to Cloudinary. Returns null (no-op) if Cloudinary isn't
// configured so the rest of the app can still function in local/dev setups.
const uploadBuffer = (buffer, options = {}) => {
  if (!isCloudinaryConfigured()) {
    logger.warn('Cloudinary not configured - skipping file upload');
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'visitor-pass', resource_type: 'auto', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

module.exports = { uploadBuffer };
