const { run, get } = require('../config/database');

const DoctorModel = {
  async create({ user_id, specialization }) {
    const sql = `INSERT INTO doctors (user_id, specialization) VALUES (?, ?)`;
    return await run(sql, [user_id, specialization]);
  },

  async findById(user_id) {
    const sql = `
      SELECT u.id, u.name, u.email, d.specialization
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ?
    `;
    return await get(sql, [user_id]);
  }
};

module.exports = DoctorModel;
