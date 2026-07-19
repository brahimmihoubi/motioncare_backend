-- Migration 004: Add custom exercise request fields
-- Doctors can now request a brand-new exercise (name + description)
-- without needing to link to an existing exercise or patient upfront.

ALTER TABLE exercise_requests ADD COLUMN name TEXT;
ALTER TABLE exercise_requests ADD COLUMN description TEXT;
ALTER TABLE exercise_requests ADD COLUMN reference_link TEXT;

-- Make exercise_id and patient_id nullable for custom requests
-- SQLite cannot drop NOT NULL directly; we recreate the table.

PRAGMA foreign_keys = OFF;

CREATE TABLE exercise_requests_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL,
  patient_id INTEGER,
  exercise_id INTEGER,
  name TEXT,
  description TEXT,
  reference_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','under_review','accepted','rejected','delivered')),
  notes TEXT,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
);

INSERT INTO exercise_requests_new (id, doctor_id, patient_id, exercise_id, name, description, reference_link, status, notes, admin_notes, created_at, updated_at)
SELECT id, doctor_id, patient_id, exercise_id, NULL, NULL, NULL, status, notes, admin_notes, created_at, updated_at
FROM exercise_requests;

DROP TABLE exercise_requests;
ALTER TABLE exercise_requests_new RENAME TO exercise_requests;

PRAGMA foreign_keys = ON;
