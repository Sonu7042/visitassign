const mongoose = require('mongoose');

const passSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    passNumber: { type: String, required: true, unique: true },
    qrCode: { type: String }, // QR code image (data URL or hosted URL)
    pdfUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'checked-in', 'checked-out', 'expired'],
      default: 'active',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pass', passSchema);
