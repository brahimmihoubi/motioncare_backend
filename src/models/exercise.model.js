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
  }
};

module.exports = ExerciseModel;
