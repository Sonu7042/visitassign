const Joi = require('joi');

const updateOrganizationSchema = Joi.object({
  organizationName: Joi.string().min(2).max(150),
  address: Joi.string().allow('', null),
  subscriptionPlan: Joi.string().valid('free', 'basic', 'pro', 'enterprise'),
}).min(1);

module.exports = { updateOrganizationSchema };
