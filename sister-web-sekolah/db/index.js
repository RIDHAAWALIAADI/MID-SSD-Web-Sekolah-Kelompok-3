/**
 * db/index.js
 * Koneksi ke "database utama" (SQLite tunggal, dipakai bersama oleh
 * SEMUA modul: Manajemen Pengguna, Kesiswaan, Jurnal Mengajar, BK).
 *
 * Memakai modul bawaan Node.js `node:sqlite` (tersedia sejak Node 22.5+)
 * supaya proyek ini tidak butuh `npm install` sama sekali untuk berjalan.
 *
 * Catatan skalabilitas (lihat README):
 * Untuk beban produksi/multi-server, file SQLite ini tinggal diganti
 * menjadi koneksi ke MySQL/PostgreSQL terkelola (mis. RDS / Cloud SQL)
 * tanpa mengubah query karena helper get/all/run di bawah ini
 * mengabstraksi akses data dari sisa aplikasi.
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// DB_PATH bisa dioverride lewat environment variable, contoh:
//   DB_PATH=/data/school.db node server.js
// Default-nya file db/school.db di dalam folder proyek ini.
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'school.db');
const isNew = !fs.existsSync(DB_FILE);

const conn = new DatabaseSync(DB_FILE);
conn.exec('PRAGMA foreign_keys = ON;');

if (isNew) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  conn.exec(schema);
  console.log('[DB] Database baru dibuat & skema diterapkan:', DB_FILE);
}

function run(sql, params = []) {
  const stmt = conn.prepare(sql);
  return stmt.run(...params);
}

function get(sql, params = []) {
  const stmt = conn.prepare(sql);
  return stmt.get(...params) || null;
}

function all(sql, params = []) {
  const stmt = conn.prepare(sql);
  return stmt.all(...params);
}

module.exports = { conn, run, get, all, DB_FILE, isNew };
