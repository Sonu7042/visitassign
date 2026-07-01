const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_URL || process.env.CLIENT_URLS || DEFAULT_CLIENT_URL;

  return rawOrigins
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};
