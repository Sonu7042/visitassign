const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../services/auth.service');
const User = require('../models/User');

// Verifies the Bearer access token and attaches the user document to req.user
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }

  req.user = user;
  next();
});

// Restricts a route to the given roles, e.g. authorize('admin', 'security')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };
