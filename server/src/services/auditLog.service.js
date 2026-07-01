const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Records a sensitive action (user CRUD, approvals, pass generation, check
// in/out, etc.) for the admin-facing audit trail. Failures here must never
// break the calling request, so errors are swallowed and logged.
const logAction = async ({ actor, action, entity, entityId, organizationId, details }) => {
  try {
    await AuditLog.create({ actor, action, entity, entityId, organizationId, details });
  } catch (err) {
    logger.error(`Failed to write audit log: ${err.message}`);
  }
};

module.exports = { logAction };
