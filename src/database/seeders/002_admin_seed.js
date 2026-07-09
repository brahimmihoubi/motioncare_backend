const { hashPassword } = require('../../utils/hash.util');

const seedAdmin = async (run, get) => {
  const adminEmail = 'admin@motioncare.com';
  
  const existing = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    // Note: We use bcrypt to hash the default password 'admin123'
    const passwordHash = await hashPassword('admin123');
    await run('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)', [
      adminEmail, 
      passwordHash, 
      'admin', 
      'System Administrator'
    ]);
    console.log('Seeded default administrator successfully. (admin@motioncare.com / admin123)');
  }
};

module.exports = { seedAdmin };
