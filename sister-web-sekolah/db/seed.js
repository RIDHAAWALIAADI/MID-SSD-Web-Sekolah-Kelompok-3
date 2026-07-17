/**
 * db/seed.js
 * Mengisi data DUMMY (bukan data asli siswa/sekolah) supaya proyek
 * bisa langsung dicoba. Jalankan manual dengan: `node db/seed.js`
 * Aman dijalankan berulang kali (cek dulu apakah data sudah ada).
 */

const db = require('./index');
const { hashPassword } = require('../lib/auth');

function seed() {
  const roleCount = db.get('SELECT COUNT(*) AS c FROM roles').c;
  if (roleCount > 0) {
    console.log('[SEED] Data sudah ada, seed dilewati. (hapus db/school.db untuk mengulang dari nol)');
    return;
  }

  console.log('[SEED] Mengisi data dummy...');

  const roles = ['admin', 'guru', 'guru_bk', 'wali_kelas', 'kepala_sekolah', 'siswa', 'orang_tua'];
  roles.forEach((r) => db.run('INSERT INTO roles (name) VALUES (?)', [r]));
  const roleId = (name) => db.get('SELECT id FROM roles WHERE name = ?', [name]).id;

  const ayId = db.run('INSERT INTO academic_years (name, is_active) VALUES (?, 1)', ['2025/2026']).lastInsertRowid;
  db.run('INSERT INTO semesters (academic_year_id, name) VALUES (?, ?)', [ayId, 'Ganjil']);
  db.run('INSERT INTO semesters (academic_year_id, name) VALUES (?, ?)', [ayId, 'Genap']);

  const subjects = [
    ['MTK', 'Matematika'],
    ['BIN', 'Bahasa Indonesia'],
    ['BIG', 'Bahasa Inggris'],
    ['IPA', 'Ilmu Pengetahuan Alam'],
    ['IPS', 'Ilmu Pengetahuan Sosial'],
  ];
  subjects.forEach(([code, name]) => db.run('INSERT INTO subjects (code, name) VALUES (?, ?)', [code, name]));
  const subjectId = (code) => db.get('SELECT id FROM subjects WHERE code = ?', [code]).id;

  const teachers = [
    ['196501011', 'Budi Santoso', subjectId('MTK')],
    ['196502022', 'Siti Rahma', subjectId('BIN')],
    ['196503033', 'Rina Kartika', null], // Guru BK
    ['196504044', 'Andi Wijaya', subjectId('BIG')],
  ];
  teachers.forEach(([nip, name, subj]) => db.run('INSERT INTO teachers (nip, name, subject_id) VALUES (?, ?, ?)', [nip, name, subj]));
  const teacherId = (name) => db.get('SELECT id FROM teachers WHERE name = ?', [name]).id;

  const classes = [
    ['X IPA 1', teacherId('Budi Santoso'), ayId],
    ['X IPA 2', teacherId('Siti Rahma'), ayId],
  ];
  classes.forEach(([name, wali, ay]) => db.run('INSERT INTO classes (name, wali_kelas_teacher_id, academic_year_id) VALUES (?, ?, ?)', [name, wali, ay]));
  const classId = (name) => db.get('SELECT id FROM classes WHERE name = ?', [name]).id;

  const students = [
    ['2025001', 'Ahmad Fauzi', classId('X IPA 1'), 'L', '2009-03-11', 'Slamet Fauzi', 'Aktif'],
    ['2025002', 'Bunga Melati', classId('X IPA 1'), 'P', '2009-05-22', 'Hendra Melati', 'Aktif'],
    ['2025003', 'Citra Ayu', classId('X IPA 1'), 'P', '2009-01-15', 'Wawan Ayu', 'Aktif'],
    ['2025004', 'Dedi Kurniawan', classId('X IPA 2'), 'L', '2009-07-09', 'Joko Kurniawan', 'Aktif'],
    ['2025005', 'Eka Putri', classId('X IPA 2'), 'P', '2009-09-30', 'Rudi Putri', 'Aktif'],
    ['2025006', 'Fajar Ramadhan', classId('X IPA 2'), 'L', '2009-02-18', 'Yusuf Ramadhan', 'Pindah'],
  ];
  students.forEach(([nis, name, cid, gender, bd, parent, status]) =>
    db.run(
      'INSERT INTO students (nis, name, class_id, gender, birth_date, parent_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nis, name, cid, gender, bd, parent, status]
    )
  );
  const studentId = (name) => db.get('SELECT id FROM students WHERE name = ?', [name]).id;

  // ---- Akun demo (password sama semua supaya mudah dicoba: password123) ----
  const users = [
    ['Admin Sekolah', 'admin@sekolah.test', 'admin', null, null, null],
    ['Budi Santoso', 'guru@sekolah.test', 'guru', teacherId('Budi Santoso'), null, null],
    ['Rina Kartika', 'bk@sekolah.test', 'guru_bk', teacherId('Rina Kartika'), null, null],
    ['Wali Kelas X IPA 1', 'walikelas@sekolah.test', 'wali_kelas', teacherId('Budi Santoso'), null, null],
    ['Kepala Sekolah', 'kepsek@sekolah.test', 'kepala_sekolah', null, null, null],
    ['Ahmad Fauzi', 'siswa@sekolah.test', 'siswa', null, studentId('Ahmad Fauzi'), null],
    ['Orang Tua Ahmad', 'ortu@sekolah.test', 'orang_tua', null, null, studentId('Ahmad Fauzi')],
  ];
  users.forEach(([name, email, role, tId, sId, parentOfSid]) => {
    db.run(
      `INSERT INTO users (name, email, password_hash, role_id, teacher_id, student_id, parent_of_student_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, email, hashPassword('password123'), roleId(role), tId, sId, parentOfSid]
    );
  });

  // ---- Contoh jurnal mengajar ----
  db.run(
    `INSERT INTO teaching_journals (teacher_id, class_id, subject_id, date, material, method, notes)
     VALUES (?, ?, ?, date('now','-2 day'), ?, ?, ?)`,
    [teacherId('Budi Santoso'), classId('X IPA 1'), subjectId('MTK'), 'Persamaan Linear Satu Variabel', 'Ceramah & Diskusi', 'Siswa aktif bertanya']
  );
  db.run(
    `INSERT INTO teaching_journals (teacher_id, class_id, subject_id, date, material, method, notes)
     VALUES (?, ?, ?, date('now','-1 day'), ?, ?, ?)`,
    [teacherId('Siti Rahma'), classId('X IPA 2'), subjectId('BIN'), 'Teks Anekdot', 'Diskusi Kelompok', 'Semua kelompok presentasi']
  );

  // ---- Contoh data BK ----
  db.run(
    `INSERT INTO bk_cases (student_id, teacher_id, case_type, description, status, date)
     VALUES (?, ?, 'konseling', ?, 'Selesai', date('now','-5 day'))`,
    [studentId('Citra Ayu'), teacherId('Rina Kartika'), 'Konsultasi kesulitan belajar Matematika']
  );
  db.run(
    `INSERT INTO bk_counseling_notes (student_id, teacher_id, notes, follow_up, date)
     VALUES (?, ?, ?, ?, date('now','-5 day'))`,
    [studentId('Citra Ayu'), teacherId('Rina Kartika'), 'Siswa merasa kesulitan memahami rumus aljabar', 'Rekomendasi les tambahan & dipantau wali kelas']
  );
  db.run(
    `INSERT INTO student_violations (student_id, teacher_id, description, point, date)
     VALUES (?, ?, ?, ?, date('now','-10 day'))`,
    [studentId('Fajar Ramadhan'), teacherId('Rina Kartika'), 'Terlambat masuk sekolah', 5]
  );
  db.run(
    `INSERT INTO student_achievements (student_id, description, level, date)
     VALUES (?, ?, ?, date('now','-20 day'))`,
    [studentId('Bunga Melati'), 'Juara 2 Lomba Cerdas Cermat', 'Kabupaten']
  );

  console.log('[SEED] Selesai. Total user demo:', users.length);
}

seed();
