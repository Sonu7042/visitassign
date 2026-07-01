const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    purpose: { type: String, required: true, trim: true },
    visitDate: { type: Date, required: true },
    expectedCheckIn: { type: Date, required: true },
    expectedCheckOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ hostId: 1, status: 1 });
appointmentSchema.index({ visitDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
