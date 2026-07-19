-- Migration 003: Fix sessions.status CHECK constraint
-- SQLite does not support ALTER COLUMN to change CHECK constraints.
-- We recreate the sessions table with the correct, complete status list.

PRAGMA foreign_keys = OFF;

-- Step 1: Create new sessions table with correct constraint
CREATE TABLE IF NOT EXISTS sessions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'completed', 'missed', 'pending',
    'running', 'paused', 'stopped',
    'countdown', 'emergency_stop'
  )),
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Step 2: Copy existing data (normalise any bad statuses to 'pending')
INSERT INTO sessions_new (id, patient_id, program_id, date, duration, status)
SELECT
  id, patient_id, program_id, date, duration,
  CASE
    WHEN status IN ('completed','missed','pending','running','paused','stopped','countdown','emergency_stop')
      THEN status
    ELSE 'pending'
  END
FROM sessions;

-- Step 3: Drop old table and rename new one
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;

-- Step 4: Recreate indexes / foreign keys that referenced sessions
-- (SQLite drops these with the table, so we recreate them)
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_program  ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status   ON sessions(status);

PRAGMA foreign_keys = ON;
