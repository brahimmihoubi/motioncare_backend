const { run, get, all } = require('../config/database');

const NotificationModel = {
  async create({ user_id, title, body, type = 'info' }) {
    const result = await run(
      `INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)`,
      [user_id, title, body, type]
    );
    return result.id;
  },

  async findByUser(user_id, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const rows = await all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    const [{ total }] = await all(`SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`, [user_id]);
    const [{ unread }] = await all(`SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND read = 0`, [user_id]);
    return { rows, total, unread, page, limit };
  },

  async markRead(id, user_id) {
    await run(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`, [id, user_id]);
  },

  async markAllRead(user_id) {
    await run(`UPDATE notifications SET read = 1 WHERE user_id = ?`, [user_id]);
  },

  async getUnreadCount(user_id) {
    const row = await get(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`, [user_id]);
    return row?.count || 0;
  }
};

module.exports = NotificationModel;
