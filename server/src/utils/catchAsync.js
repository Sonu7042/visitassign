// Wraps an async route/controller handler so rejected promises are
// forwarded to Express's error-handling middleware.
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
