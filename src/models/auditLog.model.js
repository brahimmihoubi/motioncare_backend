const { run, get, all } = require('../config/database');

const AuditLogModel = {
  async create({ user_id, user_name, action, entity, entity_id, payload, ip }) {
    await run(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, payload, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id || null, user_name || null, action, entity, entity_id || null,
       payload ? JSON.stringify(payload) : null, ip || null]
    );
  },

  async findAll({ page = 1, limit = 30, action, entity, user_id } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (action) { where += ' AND action = ?'; params.push(action); }
    if (entity) { where += ' AND entity = ?'; params.push(entity); }
    if (user_id) { where += ' AND user_id = ?'; params.push(user_id); }

    const rows = await all(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [{ total }] = await all(`SELECT COUNT(*) as total FROM audit_logs ${where}`, params);
    return { rows, total, page, limit };
  }
};

module.exports = AuditLogModel;
