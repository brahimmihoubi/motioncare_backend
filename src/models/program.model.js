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
  },

  async findAll() {
    // For admin: get all programs with patient name, doctor name, and exercise count
    const sql = `
      SELECT 
        prog.id,
        prog.name,
        prog.created_at,
        prog.active,
        u_patient.name as patientName,
        u_doctor.name as doctorName,
        (SELECT count(*) FROM program_exercises pe WHERE pe.program_id = prog.id) as exerciseCount
      FROM programs prog
      LEFT JOIN users u_patient ON prog.patient_id = u_patient.id
      LEFT JOIN users u_doctor ON prog.doctor_id = u_doctor.id
      ORDER BY prog.created_at DESC
    `;
    return await all(sql);
  },

  async findById(program_id) {
    const prog = await get(`SELECT * FROM programs WHERE id = ?`, [program_id]);
    if (prog) {
      const exSql = `
        SELECT pe.*, e.name, e.description, e.image_url
        FROM program_exercises pe
        JOIN exercises e ON pe.exercise_id = e.id
        WHERE pe.program_id = ?
      `;
      prog.exercises = await all(exSql, [program_id]);
    }
    return prog;
  },

  async updateProgram(program_id, { name, active }) {
    const sql = `UPDATE programs SET name = ?, active = ? WHERE id = ?`;
    return await run(sql, [name, active, program_id]);
  },

  async updateExercises(program_id, exercises) {
    // Delete old exercises and reinsert
    await run(`DELETE FROM program_exercises WHERE program_id = ?`, [program_id]);
    for (const ex of exercises) {
      await run(
        `INSERT INTO program_exercises (program_id, exercise_id, repetitions, sets, rest_between_reps, rest_between_sets, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [program_id, ex.exercise_id, ex.repetitions || 10, ex.sets || 3, ex.rest_between_reps || 30, ex.rest_between_sets || 60, ex.duration || 0, ex.notes || '']
      );
    }
  },
  async findByDoctor(doctor_id) {
    const sql = `
      SELECT 
        prog.id,
        prog.name,
        prog.created_at,
        prog.active,
        u_patient.name as patientName,
        (SELECT count(*) FROM program_exercises pe WHERE pe.program_id = prog.id) as exerciseCount
      FROM programs prog
      LEFT JOIN users u_patient ON prog.patient_id = u_patient.id
      WHERE prog.doctor_id = ?
      ORDER BY prog.created_at DESC
    `;
    return await all(sql, [doctor_id]);
  }
};

module.exports = ProgramModel;
