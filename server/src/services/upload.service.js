const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const uploadBuffer = (buffer, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw ApiError.serviceUnavailable('File uploads are not configured');
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw ApiError.badRequest('The uploaded file is empty');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'visitor-pass',
        resource_type: 'auto',
        overwrite: false,
        unique_filename: true,
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(ApiError.serviceUnavailable(`Cloudinary upload failed: ${error.message}`));
        }
        resolve(result);
      }
    );

    stream.on('error', (error) => {
      reject(ApiError.serviceUnavailable(`Cloudinary upload failed: ${error.message}`));
    });
    stream.end(buffer);
  });
};

module.exports = { uploadBuffer };
