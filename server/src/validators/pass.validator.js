const Joi = require('joi');

const generatePassSchema = Joi.object({
  appointmentId: Joi.string().hex().length(24).required(),
});

module.exports = { generatePassSchema };
