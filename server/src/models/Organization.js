const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    logo: { type: String },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
