const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'security', 'employee').required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().min(7).max(20),
  role: Joi.string().valid('admin', 'security', 'employee'),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createUserSchema, updateUserSchema };
