-- =====================================================================
-- SISTER - Sistem Informasi Sekolah Terintegrasi
-- Skema database terpusat (satu database utama dipakai semua modul)
-- =====================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE  -- admin, guru, guru_bk, wali_kelas, kepala_sekolah, siswa, orang_tua
);

CREATE TABLE IF NOT EXISTS academic_years (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,        -- contoh: 2025/2026
  is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS semesters (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id  INTEGER NOT NULL REFERENCES academic_years(id),
  name              TEXT NOT NULL   -- Ganjil / Genap
);

CREATE TABLE IF NOT EXISTS subjects (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nip         TEXT UNIQUE,
  name        TEXT NOT NULL,
  subject_id  INTEGER REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS classes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT NOT NULL,          -- contoh: X IPA 1
  wali_kelas_teacher_id INTEGER REFERENCES teachers(id),
  academic_year_id    INTEGER REFERENCES academic_years(id)
);

CREATE TABLE IF NOT EXISTS students (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nis          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  class_id     INTEGER REFERENCES classes(id),
  gender       TEXT,                 -- L / P
  birth_date   TEXT,
  parent_name  TEXT,
  status       TEXT NOT NULL DEFAULT 'Aktif',   -- Aktif, Pindah, Lulus, Keluar
  created_at   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role_id        INTEGER NOT NULL REFERENCES roles(id),
  teacher_id     INTEGER REFERENCES teachers(id),   -- diisi jika role guru / guru_bk / wali_kelas
  student_id     INTEGER REFERENCES students(id),   -- diisi jika role siswa
  parent_of_student_id INTEGER REFERENCES students(id), -- diisi jika role orang_tua
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS teaching_journals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id  INTEGER NOT NULL REFERENCES teachers(id),
  class_id    INTEGER NOT NULL REFERENCES classes(id),
  subject_id  INTEGER NOT NULL REFERENCES subjects(id),
  date        TEXT NOT NULL,
  material    TEXT NOT NULL,
  method      TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS bk_counseling_notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES students(id),
  teacher_id  INTEGER NOT NULL REFERENCES teachers(id),
  notes       TEXT NOT NULL,
  follow_up   TEXT,
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS student_violations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES students(id),
  teacher_id  INTEGER NOT NULL REFERENCES teachers(id),
  description TEXT NOT NULL,
  point       INTEGER NOT NULL DEFAULT 0,
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS student_achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES students(id),
  description TEXT NOT NULL,
  level       TEXT,     -- Sekolah, Kecamatan, Kabupaten, Provinsi, Nasional
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- bk_cases: rekap kasus BK (menggabungkan referensi ke 3 tabel di atas / catatan umum)
CREATE TABLE IF NOT EXISTS bk_cases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES students(id),
  teacher_id  INTEGER NOT NULL REFERENCES teachers(id),
  case_type   TEXT NOT NULL,   -- konseling, pelanggaran, prestasi
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Baru',  -- Baru, Proses, Selesai
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  action      TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Indeks untuk mempercepat pencarian (bagian dari strategi database optimization)
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_journals_teacher ON teaching_journals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_journals_class ON teaching_journals(class_id);
CREATE INDEX IF NOT EXISTS idx_bkcases_student ON bk_cases(student_id);
CREATE INDEX IF NOT EXISTS idx_violations_student ON student_violations(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
