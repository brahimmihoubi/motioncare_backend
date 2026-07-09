const { run, get, all } = require('../config/database');

const PatientModel = {
  async create({ user_id, doctor_id, age, notes }) {
    const sql = `INSERT INTO patients (user_id, doctor_id, age, notes) VALUES (?, ?, ?, ?)`;
    return await run(sql, [user_id, doctor_id, age, notes]);
  },

  async findByDoctor(doctor_id) {
    const sql = `
      SELECT u.id, u.name, u.email, p.age, p.notes, p.doctor_id
      FROM users u
      JOIN patients p ON u.id = p.user_id
      WHERE p.doctor_id = ?
    `;
    return await all(sql, [doctor_id]);
  },

  async findById(user_id) {
    const sql = `
      SELECT u.id, u.name, u.email, p.age, p.notes, p.doctor_id
      FROM users u
      JOIN patients p ON u.id = p.user_id
      WHERE u.id = ?
    `;
    return await get(sql, [user_id]);
  }
};

module.exports = PatientModel;
