const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisify sqlite3 methods
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const initDB = async () => {
  console.log("Initializing SQLite database schema...");
  
  // Read and execute migrations
  const schemaPath = path.resolve(__dirname, '../database/migrations/001_initial_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log("Database schema (001) initialized.");

  // SRS Upgrade migration
  const upgradePath = path.resolve(__dirname, '../database/migrations/002_srs_upgrade.sql');
  const upgradeSchema = fs.readFileSync(upgradePath, 'utf8');
  await new Promise((resolve, reject) => {
    db.exec(upgradeSchema, (err) => {
      if (err) { console.warn('[Migration 002] Warning:', err.message); resolve(); } // non-fatal for idempotency
      else resolve();
    });
  });
  console.log("Database schema (002) initialized.");

  // Execute seeders
  const { seedExercises } = require('../database/seeders/001_default_exercises');
  await seedExercises(run, get);
  
  const { seedAdmin } = require('../database/seeders/002_admin_seed');
  await seedAdmin(run, get);
  
  console.log("Database setup complete!");
};

module.exports = { db, run, get, all, initDB };