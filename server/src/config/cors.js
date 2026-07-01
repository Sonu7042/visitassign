const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_URL || process.env.CLIENT_URLS || DEFAULT_CLIENT_URL;

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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
