const { run, get, all } = require('../config/database');

const UserModel = {
  async create({ email, password, role, name }) {
    const sql = `INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)`;
    const result = await run(sql, [email, password, role, name]);
    return result.id;
  },

  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await get(sql, [email]);
  },

  async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    return await get(sql, [id]);
  },

  async findAllByRole(role) {
    const sql = `SELECT id, email, role, name, created_at FROM users WHERE role = ?`;
    return await all(sql, [role]);
  }
};

module.exports = UserModel;
