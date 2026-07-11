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

  async getProgressStats(doctor_id) {
    // 1. Daily completion rate for the last 7 days
    const dailySql = `
      SELECT 
        strftime('%w', s.date) as dayOfWeek,
        date(s.date) as day,
        SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed,
        COUNT(*) as total
      FROM sessions s
      JOIN programs p ON s.program_id = p.id
      WHERE p.doctor_id = ? AND s.date >= date('now', '-7 days')
      GROUP BY date(s.date)
      ORDER BY date(s.date) ASC
    `;
    const dailyData = await all(dailySql, [doctor_id]);

    // 2. Weekly session count for the last 6 weeks
    const weeklySql = `
      SELECT 
        strftime('%W', s.date) as weekNum,
        COUNT(*) as sessions
      FROM sessions s
      JOIN programs p ON s.program_id = p.id
      WHERE p.doctor_id = ? AND s.date >= date('now', '-42 days')
      GROUP BY weekNum
      ORDER BY weekNum ASC
    `;
    const weeklyData = await all(weeklySql, [doctor_id]);

    // 3. Top stats
    const statsSql = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completedSessions,
        SUM(s.duration) as totalDuration
      FROM sessions s
      JOIN programs p ON s.program_id = p.id
      WHERE p.doctor_id = ?
    `;
    const stats = await get(statsSql, [doctor_id]);

    return { dailyData, weeklyData, stats };
  },
  
  async getGlobalStats() {
    // This is for admin dashboard analytics
    const sql = `
      SELECT status, count(*) as count 
      FROM sessions
      GROUP BY status
    `;
    return await all(sql);
  },

  async getGlobalRecentSessions(limit = 10) {
    // Fetch recent sessions with patient name and program name for admin dashboard
    const sql = `
      SELECT 
        s.id,
        s.status,
        s.date,
        s.duration,
        u.name as patientName,
        prog.name as programName
      FROM sessions s
      JOIN users u ON s.patient_id = u.id
      JOIN programs prog ON s.program_id = prog.id
      ORDER BY s.date DESC
      LIMIT ?
    `;
    return await all(sql, [limit]);
  },

  async getGlobalWeeklyStats() {
    // Get per-day session stats for the last 7 days
    const sql = `
      SELECT 
        strftime('%w', date) as dayOfWeek,
        date(date) as day,
        status,
        count(*) as count
      FROM sessions
      WHERE date >= date('now', '-7 days')
      GROUP BY date(date), status
      ORDER BY date(date) ASC
    `;
    return await all(sql);
  },

  async update(id, { status, duration }) {
    const sql = `UPDATE sessions SET status = ?, duration = ? WHERE id = ?`;
    return await run(sql, [status, duration, id]);
  },

  async delete(id) {
    // Also delete session_exercises
    await run(`DELETE FROM session_exercises WHERE session_id = ?`, [id]);
    await run(`DELETE FROM sessions WHERE id = ?`, [id]);
  }
};

module.exports = SessionModel;
