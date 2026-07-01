const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'security', 'employee').default('employee'),
  organizationId: Joi.string().hex().length(24),
  organizationName: Joi.string().min(2).max(150),
})
  .xor('organizationId', 'organizationName')
  .messages({
    'object.xor':
      'Provide either "organizationName" (to create a new organization) or "organizationId" (to join an existing one)',
  });

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

const sendOtpSchema = Joi.object({
  target: Joi.string().email().required(),
  channel: Joi.string().valid('email').default('email'),
  purpose: Joi.string().valid('visitor-registration', 'login').default('visitor-registration'),
});

const verifyOtpSchema = Joi.object({
  target: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  purpose: Joi.string().valid('visitor-registration', 'login').default('visitor-registration'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
};
