const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const OTP_TOKEN_EXPIRES_IN = '15m';

// Parses simple durations like "15m", "7d", "30s", "1h" into milliseconds.
const parseDuration = (value) => {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(value).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * multipliers[match[2]];
};

const generateAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : undefined,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Short-lived token proving an email target completed OTP verification.
const generateOtpVerificationToken = ({ target, purpose }) =>
  jwt.sign({ target, purpose, verified: true }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: OTP_TOKEN_EXPIRES_IN,
  });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOtpVerificationToken,
  REFRESH_TOKEN_TTL_MS: parseDuration(REFRESH_EXPIRES_IN),
};
