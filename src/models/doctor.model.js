const { run, get, all } = require('../config/database');

const DoctorModel = {
  async create({ user_id, specialization }) {
    const sql = `INSERT INTO doctors (user_id, specialization) VALUES (?, ?)`;
    return await run(sql, [user_id, specialization]);
  },

  async findById(user_id) {
    const sql = `
      SELECT u.id, u.name, u.email, d.specialization, u.created_at
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ?
    `;
    return await get(sql, [user_id]);
  },

  async update(user_id, { name, specialization }) {
    if (name) {
      await run(`UPDATE users SET name = ? WHERE id = ?`, [name, user_id]);
    }
    if (specialization !== undefined) {
      await run(`UPDATE doctors SET specialization = ? WHERE user_id = ?`, [specialization, user_id]);
    }
  },

  async delete(user_id) {
    // Cascades to doctors table via FK ON DELETE CASCADE
    await run(`DELETE FROM users WHERE id = ?`, [user_id]);
  }
};

module.exports = DoctorModel;
