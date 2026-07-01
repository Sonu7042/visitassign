const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

  return rawOrigins.split(',').map(normalizeOrigin).filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Requests forwarded by the frontend rewrite and server-to-server tools do
    // not necessarily include Origin. Browser origins must match explicitly.
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = {
  allowedOrigins,
  corsOptions,
};
