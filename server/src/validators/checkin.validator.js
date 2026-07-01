const Joi = require('joi');

const scanSchema = Joi.object({
  qrData: Joi.string().required(),
  location: Joi.string().allow('', null),
});

module.exports = { scanSchema };
