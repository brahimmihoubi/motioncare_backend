const { run, get, all } = require('../config/database');

const SessionExerciseModel = {
  async create({ session_id, program_exercise_id, completed_sets, completed_reps }) {
    const sql = `
      INSERT INTO session_exercises (session_id, program_exercise_id, completed_sets, completed_reps) 
      VALUES (?, ?, ?, ?)
    `;
    return await run(sql, [session_id, program_exercise_id, completed_sets, completed_reps]);
  }
};

module.exports = SessionExerciseModel;
