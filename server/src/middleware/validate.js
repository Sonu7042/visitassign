const ApiError = require('../utils/ApiError');

// Validates req[property] (default: body) against a Joi schema.
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation error', details));
  }

  req[property] = value;
  next();
};

module.exports = validate;
