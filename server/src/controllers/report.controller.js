const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { toCsv } = require('../utils/csv');

const sendCsv = (res, filename, rows, fields) => {
  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  return res.send(toCsv(rows, fields));
};

const getVisitorsReport = catchAsync(async (req, res) => {
  const { organizationId } = req.user;
  const { search, isBlacklisted, startDate, endDate, format } = req.query;

  const filter = { organizationId };
  if (isBlacklisted !== undefined) filter.isBlacklisted = isBlacklisted === 'true';
  if (search) filter.$text = { $search: search };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const visitors = await Visitor.find(filter).sort({ createdAt: -1 });

  if (format === 'csv') {
    return sendCsv(res, 'visitors-report.csv', visitors, [
      { label: 'Full Name', value: 'fullName' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Company', value: 'company' },
      { label: 'Blacklisted', value: (row) => (row.isBlacklisted ? 'Yes' : 'No') },
      { label: 'Registered On', value: (row) => new Date(row.createdAt).toISOString() },
    ]);
  }

  return new ApiResponse(200, 'Visitors report fetched successfully', { visitors }).send(res);
});

const getAppointmentsReport = catchAsync(async (req, res) => {
  const { organizationId, role, _id } = req.user;
  const { status, startDate, endDate, hostId, format } = req.query;

  const filter = { organizationId };
  if (status) filter.status = status;
  if (role === 'employee') filter.hostId = _id;
  else if (hostId) filter.hostId = hostId;
  if (startDate || endDate) {
    filter.visitDate = {};
    if (startDate) filter.visitDate.$gte = new Date(startDate);
    if (endDate) filter.visitDate.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(filter)
    .sort({ visitDate: -1 })
    .populate('visitorId', 'fullName email phone company')
    .populate('hostId', 'name email');

  if (format === 'csv') {
    return sendCsv(res, 'appointments-report.csv', appointments, [
      { label: 'Visitor', value: (row) => row.visitorId?.fullName },
      { label: 'Visitor Email', value: (row) => row.visitorId?.email },
      { label: 'Host', value: (row) => row.hostId?.name },
      { label: 'Purpose', value: 'purpose' },
      { label: 'Visit Date', value: (row) => new Date(row.visitDate).toISOString() },
      { label: 'Status', value: 'status' },
    ]);
  }

  return new ApiResponse(200, 'Appointments report fetched successfully', { appointments }).send(res);
});

const getCheckLogsReport = catchAsync(async (req, res) => {
  const { organizationId } = req.user;
  const { startDate, endDate, scanType, format } = req.query;

  const match = {};
  if (scanType) match.scanType = scanType;
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }

  const logs = await CheckLog.aggregate([
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
    { $match: { 'appointment.organizationId': new mongoose.Types.ObjectId(organizationId) } },
    { $lookup: { from: 'visitors', localField: 'appointment.visitorId', foreignField: '_id', as: 'visitor' } },
    { $unwind: '$visitor' },
    { $lookup: { from: 'users', localField: 'appointment.hostId', foreignField: '_id', as: 'host' } },
    { $unwind: '$host' },
    { $lookup: { from: 'users', localField: 'scannedBy', foreignField: '_id', as: 'scannedByUser' } },
    { $unwind: '$scannedByUser' },
    { $sort: { timestamp: -1 } },
    {
      $project: {
        scanType: 1,
        timestamp: 1,
        location: 1,
        passNumber: '$pass.passNumber',
        visitorName: '$visitor.fullName',
        visitorEmail: '$visitor.email',
        hostName: '$host.name',
        scannedBy: '$scannedByUser.name',
      },
    },
  ]);

  if (format === 'csv') {
    return sendCsv(res, 'check-logs-report.csv', logs, [
      { label: 'Pass Number', value: 'passNumber' },
      { label: 'Visitor', value: 'visitorName' },
      { label: 'Visitor Email', value: 'visitorEmail' },
      { label: 'Host', value: 'hostName' },
      { label: 'Type', value: 'scanType' },
      { label: 'Location', value: 'location' },
      { label: 'Scanned By', value: 'scannedBy' },
      { label: 'Timestamp', value: (row) => new Date(row.timestamp).toISOString() },
    ]);
  }

  return new ApiResponse(200, 'Check logs report fetched successfully', { logs }).send(res);
});

module.exports = { getVisitorsReport, getAppointmentsReport, getCheckLogsReport };
