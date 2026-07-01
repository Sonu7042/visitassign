const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema(
  {
    passId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
    scanType: { type: String, enum: ['check-in', 'check-out'], required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    location: { type: String, default: 'Main Gate', trim: true },
  },
  { timestamps: true }
);

checkLogSchema.index({ passId: 1, timestamp: -1 });

module.exports = mongoose.model('CheckLog', checkLogSchema);
