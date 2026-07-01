const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    target: { type: String, required: true, trim: true, lowercase: true },
    channel: { type: String, enum: ['email'], default: 'email', required: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['visitor-registration', 'login'],
      default: 'visitor-registration',
    },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index: Mongo automatically removes expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
