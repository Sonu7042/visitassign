const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Otp = require('../models/Otp');
const authService = require('../services/auth.service');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: authService.REFRESH_TOKEN_TTL_MS,
  });
};

// Issues a fresh access/refresh token pair and persists the refresh token
// (pruning expired ones) for rotation/revocation support.
const issueTokens = async (user) => {
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  user.refreshTokens = (user.refreshTokens || []).filter((rt) => rt.expiresAt > new Date());
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS),
  });
  await user.save();

  return { accessToken, refreshToken };
};

const register = catchAsync(async (req, res) => {
  const { name, email, phone, password, role, organizationId, organizationName } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  let organization;
  let finalRole = role || 'employee';

  if (organizationName) {
    organization = await Organization.create({ organizationName });
    finalRole = 'admin';
  } else {
    organization = await Organization.findById(organizationId);
    if (!organization) throw ApiError.badRequest('Invalid organizationId');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: finalRole,
    organizationId: organization._id,
  });

  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(201, 'User registered successfully', {
    user,
    accessToken,
    organization,
  }).send(res);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact your administrator.');
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  setRefreshCookie(res, refreshToken);

  return new ApiResponse(200, 'Login successful', { user, accessToken }).send(res);
});

const refreshTokenHandler = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let payload;
  try {
    payload = authService.verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User not found');

  const tokenEntry = (user.refreshTokens || []).find((rt) => rt.token === token);
  if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  // Rotate: invalidate the used token and issue a new pair
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
  setRefreshCookie(res, newRefreshToken);

  return new ApiResponse(200, 'Token refreshed', { accessToken }).send(res);
});

const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;

  if (token) {
    try {
      const payload = authService.verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $pull: { refreshTokens: { token } } });
    } catch (err) {
      // token already invalid/expired - nothing to clean up
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());
  return new ApiResponse(200, 'Logged out successfully').send(res);
});

const getMe = catchAsync(async (req, res) => {
  return new ApiResponse(200, 'Current user', { user: req.user }).send(res);
});

// ---------------------------------------------------------------------------
// OTP verification (bonus) - used during visitor self-registration
// ---------------------------------------------------------------------------

const generateOtpCode = () => crypto.randomInt(100000, 999999).toString();
const hashOtp = (code) => crypto.createHash('sha256').update(code).digest('hex');

const sendOtp = catchAsync(async (req, res) => {
  const { target, purpose } = req.body;
  const channel = 'email';

  const code = generateOtpCode();

  await Otp.create({
    target,
    channel,
    purpose,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail({
    to: target,
    subject: 'Your Visitor Pass verification code',
    html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`,
  });

  logger.info(`OTP generated for ${target} (${channel}/${purpose})`);

  return new ApiResponse(200, 'OTP sent successfully').send(res);
});

const verifyOtp = catchAsync(async (req, res) => {
  const { target, code, purpose } = req.body;

  const otp = await Otp.findOne({ target, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!otp || otp.codeHash !== hashOtp(code) || otp.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  otp.consumed = true;
  await otp.save();

  const verificationToken = authService.generateOtpVerificationToken({ target, purpose });

  return new ApiResponse(200, 'OTP verified successfully', { verificationToken }).send(res);
});

module.exports = {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  sendOtp,
  verifyOtp,
};
