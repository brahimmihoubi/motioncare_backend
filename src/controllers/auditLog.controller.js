const AuditLogModel = require('../models/auditLog.model');

const AuditLogController = {
  /**
   * GET /api/audit-logs — Admin only
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 30, action, entity, user_id } = req.query;
      const result = await AuditLogModel.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        action,
        entity,
        user_id: user_id ? parseInt(user_id) : undefined
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = AuditLogController;
