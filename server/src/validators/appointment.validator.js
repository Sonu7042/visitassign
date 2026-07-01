const Joi = require('joi');

const createAppointmentSchema = Joi.object({
  visitorId: Joi.string().hex().length(24).required(),
  hostId: Joi.string().hex().length(24).required(),
  purpose: Joi.string().min(2).max(300).required(),
  visitDate: Joi.date().required(),
  expectedCheckIn: Joi.date().required(),
  expectedCheckOut: Joi.date().required(),
  notes: Joi.string().allow('', null),
});

const selfRegisterSchema = Joi.object({
  organizationId: Joi.string().hex().length(24).required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).required(),
  company: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  hostId: Joi.string().hex().length(24).required(),
  purpose: Joi.string().min(2).max(300).required(),
  visitDate: Joi.date().required(),
  expectedCheckIn: Joi.date().required(),
  expectedCheckOut: Joi.date().required(),
  notes: Joi.string().allow('', null),
});

const decisionSchema = Joi.object({
  notes: Joi.string().allow('', null),
});

module.exports = { createAppointmentSchema, selfRegisterSchema, decisionSchema };
