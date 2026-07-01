const DEFAULT_CLIENT_URL = "https://visitassign.vercel.app";

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");

const parseAllowedOrigins = () => {
  const rawOrigins =
    process.env.CLIENT_URL ||
    process.env.CLIENT_URLS ||
    DEFAULT_CLIENT_URL;

  return rawOrigins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no Origin (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error("Blocked Origin:", normalizedOrigin);

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = {
  allowedOrigins,
  corsOptions,
};