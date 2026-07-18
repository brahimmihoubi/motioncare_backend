/**
 * db:reset — Wipes the database file and re-initializes it from scratch.
 * Run with: npm run db:reset
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');

// Delete the existing database file
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted: ${dbPath}`);
} else {
  console.log('No database file found, creating fresh one.');
}

// Re-initialize (migrations + seeders)
const { initDB } = require('../config/database');
initDB()
  .then(() => {
    console.log('\nDatabase reset complete! Default admin (admin / admin123) and exercises have been seeded.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Reset failed:', err.message);
    process.exit(1);
  });
