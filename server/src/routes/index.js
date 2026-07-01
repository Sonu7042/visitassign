const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Visitor Pass Management System API v1' });
});

router.use('/auth', require('./auth.routes'));
router.use('/visitors', require('./visitor.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/passes', require('./pass.routes'));
router.use('/', require('./checkin.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/organizations', require('./organization.routes'));
router.use('/users', require('./user.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
