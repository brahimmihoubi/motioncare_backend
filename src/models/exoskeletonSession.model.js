const { run, get, all } = require('../config/database');

const ExoskeletonSessionModel = {
  async create({ session_id, total_duration_seconds = 0 }) {
    const result = await run(
      `INSERT OR IGNORE INTO exoskeleton_sessions (session_id, state, total_duration_seconds)
       VALUES (?, 'pending', ?)`,
      [session_id, total_duration_seconds]
    );
    return result.id;
  },

  async findBySessionId(session_id) {
    return await get(
      `SELECT es.*, e.name as exercise_name
       FROM exoskeleton_sessions es
       LEFT JOIN exercises e ON es.current_exercise_id = e.id
       WHERE es.session_id = ?`,
      [session_id]
    );
  },

  async updateState(session_id, { state, motor_state, current_exercise_id, elapsed_seconds, countdown_remaining, error_code }) {
    const fields = [];
    const params = [];

    if (state !== undefined) { fields.push('state = ?'); params.push(state); }
    if (motor_state !== undefined) { fields.push('motor_state = ?'); params.push(motor_state); }
    if (current_exercise_id !== undefined) { fields.push('current_exercise_id = ?'); params.push(current_exercise_id); }
    if (elapsed_seconds !== undefined) { fields.push('elapsed_seconds = ?'); params.push(elapsed_seconds); }
    if (countdown_remaining !== undefined) { fields.push('countdown_remaining = ?'); params.push(countdown_remaining); }
    if (error_code !== undefined) { fields.push('error_code = ?'); params.push(error_code); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(session_id);

    if (fields.length > 1) {
      await run(`UPDATE exoskeleton_sessions SET ${fields.join(', ')} WHERE session_id = ?`, params);
    }
  }
};

module.exports = ExoskeletonSessionModel;
