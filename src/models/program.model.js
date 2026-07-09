const { run, get, all } = require('../config/database');

const ProgramModel = {
  async create({ patient_id, doctor_id, name }) {
    const sql = `INSERT INTO programs (patient_id, doctor_id, name) VALUES (?, ?, ?)`;
    return await run(sql, [patient_id, doctor_id, name]);
  },

  async addExercise({ program_id, exercise_id, repetitions, sets, rest_between_reps, rest_between_sets, duration, notes }) {
    const sql = `
      INSERT INTO program_exercises 
      (program_id, exercise_id, repetitions, sets, rest_between_reps, rest_between_sets, duration, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await run(sql, [program_id, exercise_id, repetitions, sets, rest_between_reps, rest_between_sets, duration, notes]);
  },

  async findByPatient(patient_id) {
    const sql = `SELECT * FROM programs WHERE patient_id = ? ORDER BY created_at DESC`;
    const programs = await all(sql, [patient_id]);
    
    // Fetch exercises for each program
    for (let prog of programs) {
      const exSql = `
        SELECT pe.*, e.name, e.description, e.image_url 
        FROM program_exercises pe
        JOIN exercises e ON pe.exercise_id = e.id
        WHERE pe.program_id = ?
      `;
      prog.exercises = await all(exSql, [prog.id]);
    }
    return programs;
  },

  async findActiveByPatient(patient_id) {
    const sql = `SELECT * FROM programs WHERE patient_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1`;
    const program = await get(sql, [patient_id]);
    if (program) {
       const exSql = `
        SELECT pe.*, e.name, e.description, e.image_url 
        FROM program_exercises pe
        JOIN exercises e ON pe.exercise_id = e.id
        WHERE pe.program_id = ?
      `;
      program.exercises = await all(exSql, [program.id]);
    }
    return program;
  }
};

module.exports = ProgramModel;
