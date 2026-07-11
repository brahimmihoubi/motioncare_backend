const { run, get, all } = require('../config/database');

const ExerciseModel = {
  async findAll() {
    const sql = `SELECT * FROM exercises`;
    return await all(sql);
  },

  async findById(id) {
    const sql = `SELECT * FROM exercises WHERE id = ?`;
    return await get(sql, [id]);
  },
  
  async create({ name, description, image_url }) {
    const sql = `INSERT INTO exercises (name, description, image_url) VALUES (?, ?, ?)`;
    const result = await run(sql, [name, description, image_url || '']);
    return result.id;
  },

  async update(id, { name, description, image_url }) {
    const sql = `UPDATE exercises SET name = ?, description = ?, image_url = ? WHERE id = ?`;
    return await run(sql, [name, description, image_url || '', id]);
  },

  async delete(id) {
    // Delete from program_exercises first
    await run(`DELETE FROM program_exercises WHERE exercise_id = ?`, [id]);
    await run(`DELETE FROM exercises WHERE id = ?`, [id]);
  }
};

module.exports = ExerciseModel;
