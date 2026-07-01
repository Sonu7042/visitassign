const Joi = require('joi');

const createVisitorSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).required(),
  company: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
});

const updateVisitorSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().min(7).max(20),
  company: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
}).min(1);

const blacklistSchema = Joi.object({
  isBlacklisted: Joi.boolean().required(),
  blacklistReason: Joi.string().allow('', null),
});

module.exports = { createVisitorSchema, updateVisitorSchema, blacklistSchema };
