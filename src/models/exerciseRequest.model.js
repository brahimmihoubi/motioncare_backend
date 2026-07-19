const { run, get, all } = require('../config/database');

const ExerciseRequestModel = {
  // Supports two modes:
  //  1. Custom request (from mobile): { doctor_id, name, description, reference_link, notes }
  //  2. Legacy request (from admin):  { doctor_id, patient_id, exercise_id, notes }
  async create({ doctor_id, patient_id = null, exercise_id = null, name = null, description = null, reference_link = null, notes = null }) {
    const result = await run(
      `INSERT INTO exercise_requests (doctor_id, patient_id, exercise_id, name, description, reference_link, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [doctor_id, patient_id, exercise_id, name, description, reference_link, notes]
    );
    return result.id;
  },

  async findAll({ page = 1, limit = 20, status, doctor_id } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND er.status = ?'; params.push(status); }
    if (doctor_id) { where += ' AND er.doctor_id = ?'; params.push(doctor_id); }

    const rows = await all(`
      SELECT 
        er.id, er.status, er.notes, er.admin_notes, er.created_at, er.updated_at,
        er.name, er.description, er.reference_link,
        doc.name AS doctor_name, doc.email AS doctor_email,
        pat.name AS patient_name,
        ex.id AS exercise_id, ex.name AS exercise_name, ex.description AS exercise_description
      FROM exercise_requests er
      JOIN users doc ON er.doctor_id = doc.id
      LEFT JOIN users pat ON er.patient_id = pat.id
      LEFT JOIN exercises ex ON er.exercise_id = ex.id
      ${where}
      ORDER BY er.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [{ total }] = await all(`SELECT COUNT(*) as total FROM exercise_requests er ${where}`, params);
    return { rows, total, page, limit };
  },

  async findById(id) {
    return await get(`
      SELECT 
        er.id, er.status, er.notes, er.admin_notes, er.created_at, er.updated_at,
        er.doctor_id, er.patient_id, er.exercise_id,
        er.name, er.description, er.reference_link,
        doc.name AS doctor_name, doc.email AS doctor_email,
        pat.name AS patient_name,
        ex.name AS exercise_name
      FROM exercise_requests er
      JOIN users doc ON er.doctor_id = doc.id
      LEFT JOIN users pat ON er.patient_id = pat.id
      LEFT JOIN exercises ex ON er.exercise_id = ex.id
      WHERE er.id = ?
    `, [id]);
  },

  async updateStatus(id, status, admin_notes) {
    await run(
      `UPDATE exercise_requests SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, admin_notes || null, id]
    );
  },

  async findByDoctor(doctor_id) {
    return await all(`
      SELECT 
        er.id, er.status, er.notes, er.admin_notes, er.created_at, er.updated_at,
        er.name, er.description, er.reference_link,
        pat.name AS patient_name,
        ex.name AS exercise_name, ex.description AS exercise_description
      FROM exercise_requests er
      LEFT JOIN users pat ON er.patient_id = pat.id
      LEFT JOIN exercises ex ON er.exercise_id = ex.id
      WHERE er.doctor_id = ?
      ORDER BY er.created_at DESC
    `, [doctor_id]);
  }
};

module.exports = ExerciseRequestModel;
