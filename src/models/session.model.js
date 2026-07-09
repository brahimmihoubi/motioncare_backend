const { run, get, all } = require('../config/database');

const SessionModel = {
  async create({ patient_id, program_id, duration, status = 'completed' }) {
    const sql = `INSERT INTO sessions (patient_id, program_id, duration, status) VALUES (?, ?, ?, ?)`;
    return await run(sql, [patient_id, program_id, duration, status]);
  },

  async findByPatient(patient_id) {
    const sql = `SELECT * FROM sessions WHERE patient_id = ? ORDER BY date DESC`;
    const sessions = await all(sql, [patient_id]);

    for (let s of sessions) {
      const exSql = `
        SELECT se.*, pe.exercise_id, e.name 
        FROM session_exercises se
        JOIN program_exercises pe ON se.program_exercise_id = pe.id
        JOIN exercises e ON pe.exercise_id = e.id
        WHERE se.session_id = ?
      `;
      s.exercises = await all(exSql, [s.id]);
    }
    return sessions;
  },
  
  async getStatsByDoctor(doctor_id) {
    // This is for dashboard analytics
    const sql = `
      SELECT s.status, count(*) as count 
      FROM sessions s
      JOIN programs p ON s.program_id = p.id
      WHERE p.doctor_id = ?
      GROUP BY s.status
    `;
    return await all(sql, [doctor_id]);
  },
  
  async getGlobalStats() {
    // This is for admin dashboard analytics
    const sql = `
      SELECT status, count(*) as count 
      FROM sessions
      GROUP BY status
    `;
    return await all(sql);
  }
};

module.exports = SessionModel;
