const mongoose = require('mongoose');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const countOrgPasses = async (organizationId, statusFilter = {}, extraMatch = {}) => {
  const result = await Pass.aggregate([
    { $match: statusFilter },
    {
      $lookup: {
        from: 'appointments',
        localField: 'appointmentId',
        foreignField: '_id',
        as: 'appointment',
      },
    },
    { $unwind: '$appointment' },
    { $match: { 'appointment.organizationId': organizationId, ...extraMatch } },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
};

const countOrgCheckLogs = async (organizationId, match = {}) => {
  const result = await CheckLog.aggregate([
    { $match: match },
    { $lookup: { from: 'passes', localField: 'passId', foreignField: '_id', as: 'pass' } },
    { $unwind: '$pass' },
    {
      $lookup: {
        from: 'appointments',
        localField: 'pass.appointmentId',
        foreignField: '_id',
        as: 'appointment',
      },
    },
    { $unwind: '$appointment' },
    { $match: { 'appointment.organizationId': organizationId } },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
};

const getAdminStats = async (organizationId) => {
  const today = { $gte: startOfDay(), $lte: endOfDay() };

  const [
    totalVisitors,
    blacklistedVisitors,
    totalStaff,
    totalAppointments,
    todaysAppointments,
    pendingApprovals,
    activePasses,
    checkedInNow,
  ] = await Promise.all([
    Visitor.countDocuments({ organizationId }),
    Visitor.countDocuments({ organizationId, isBlacklisted: true }),
    User.countDocuments({ organizationId, role: { $ne: 'visitor' } }),
    Appointment.countDocuments({ organizationId }),
    Appointment.countDocuments({ organizationId, visitDate: today }),
    Appointment.countDocuments({ organizationId, status: 'pending' }),
    countOrgPasses(organizationId, { status: 'active' }),
    countOrgPasses(organizationId, { status: 'checked-in' }),
  ]);

  return {
    totalVisitors,
    blacklistedVisitors,
    totalStaff,
    totalAppointments,
    todaysAppointments,
    pendingApprovals,
    activePasses,
    checkedInNow,
  };
};

const getSecurityStats = async (organizationId) => {
  const today = { $gte: startOfDay(), $lte: endOfDay() };

  const [checkedInNow, todaysCheckIns, todaysCheckOuts, todaysAppointments] = await Promise.all([
    countOrgPasses(organizationId, { status: 'checked-in' }),
    countOrgCheckLogs(organizationId, { scanType: 'check-in', timestamp: today }),
    countOrgCheckLogs(organizationId, { scanType: 'check-out', timestamp: today }),
    Appointment.countDocuments({ organizationId, status: 'approved', visitDate: today }),
  ]);

  return { checkedInNow, todaysCheckIns, todaysCheckOuts, todaysAppointments };
};

const getEmployeeStats = async (hostId) => {
  const now = new Date();

  const [pendingRequests, upcomingApprovals, totalVisitorsHosted, recentAppointments] = await Promise.all([
    Appointment.countDocuments({ hostId, status: 'pending' }),
    Appointment.countDocuments({ hostId, status: 'approved', visitDate: { $gte: now } }),
    Appointment.countDocuments({ hostId, status: 'completed' }),
    Appointment.find({ hostId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('visitorId', 'fullName email phone photo'),
  ]);

  return { pendingRequests, upcomingApprovals, totalVisitorsHosted, recentAppointments };
};

const getVisitorStats = async (visitorId) => {
  if (!visitorId) return { appointments: [], activePass: null, totalVisits: 0 };

  const appointments = await Appointment.find({ visitorId })
    .sort({ visitDate: -1 })
    .limit(10)
    .populate('hostId', 'name email');

  const appointmentIds = appointments.map((a) => a._id);
  const activePass = await Pass.findOne({
    appointmentId: { $in: appointmentIds },
    status: { $in: ['active', 'checked-in'] },
  }).sort({ createdAt: -1 });

  const totalVisits = await Appointment.countDocuments({ visitorId, status: 'completed' });

  return { appointments, activePass, totalVisits };
};

const getStats = catchAsync(async (req, res) => {
  const { role, organizationId, _id, visitorId } = req.user;

  let data;
  switch (role) {
    case 'admin':
      data = await getAdminStats(organizationId);
      break;
    case 'security':
      data = await getSecurityStats(organizationId);
      break;
    case 'employee':
      data = await getEmployeeStats(_id);
      break;
    case 'visitor':
      data = await getVisitorStats(visitorId);
      break;
    default:
      throw ApiError.forbidden('No dashboard available for this role');
  }

  return new ApiResponse(200, 'Dashboard stats fetched successfully', { role, stats: data }).send(res);
});

// Admin-only: visitors & appointments registered per month for the last 6 months
const getMonthlyAnalytics = catchAsync(async (req, res) => {
  const { organizationId } = req.user;
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [visitorTrend, appointmentTrend] = await Promise.all([
    Visitor.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  return new ApiResponse(200, 'Monthly analytics fetched successfully', {
    visitorTrend,
    appointmentTrend,
  }).send(res);
});

module.exports = { getStats, getMonthlyAnalytics };
