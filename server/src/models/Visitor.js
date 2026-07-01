const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    photo: { type: String },
    governmentId: { type: String },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
  },
  { timestamps: true }
);

visitorSchema.index({ fullName: 'text', email: 'text', phone: 'text', company: 'text' });

module.exports = mongoose.model('Visitor', visitorSchema);
