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
  },

  async update(user_id, { name, age, notes, doctor_id }) {
    // We update the users table for name, and patients table for age, notes, doctor_id
    if (name) {
      await run(`UPDATE users SET name = ? WHERE id = ?`, [name, user_id]);
    }
    await run(`UPDATE patients SET age = ?, notes = ?, doctor_id = ? WHERE user_id = ?`, [age, notes, doctor_id, user_id]);
  },

  async findAll() {
    // Admin view: all patients with doctor name, age, notes, and last session date
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        p.age,
        p.notes,
        p.doctor_id,
        doc.name AS doctorName,
        (
          SELECT s.date FROM sessions s 
          WHERE s.patient_id = u.id 
          ORDER BY s.date DESC LIMIT 1
        ) AS lastSessionDate,
        (
          SELECT s.status FROM sessions s 
          WHERE s.patient_id = u.id 
          ORDER BY s.date DESC LIMIT 1
        ) AS lastSessionStatus,
        (
          SELECT prog.name FROM programs prog 
          WHERE prog.patient_id = u.id AND prog.active = 1 
          ORDER BY prog.created_at DESC LIMIT 1
        ) AS programName
      FROM users u
      JOIN patients p ON u.id = p.user_id
      LEFT JOIN users doc ON p.doctor_id = doc.id
      ORDER BY u.created_at DESC
    `;
    return await all(sql);
  },

  async delete(user_id) {
    // Delete from patients table and users table
    await run(`DELETE FROM patients WHERE user_id = ?`, [user_id]);
    await run(`DELETE FROM users WHERE id = ?`, [user_id]);
  }
};

module.exports = PatientModel;
