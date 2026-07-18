const { run, get, all } = require('../config/database');
const crypto = require('crypto');

const RefreshTokenModel = {
  async create(user_id, expiresInDays = 30) {
    const token = crypto.randomBytes(64).toString('hex');
    const expires_at = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    await run(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user_id, token, expires_at]
    );
    return token;
  },

  async findByToken(token) {
    return await get(
      `SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0 AND expires_at > datetime('now')`,
      [token]
    );
  },

  async revoke(token) {
    await run(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`, [token]);
  },

  async revokeAllForUser(user_id) {
    await run(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`, [user_id]);
  }
};

module.exports = RefreshTokenModel;
