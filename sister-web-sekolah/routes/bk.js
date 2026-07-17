const db = require('../db');
const { requireAuth, requireRole, logActivity } = require('../lib/auth');
const {
  bkIndexPage,
  bkFormPage,
  bkDetailPage,
  violationsListPage,
  violationFormPage,
  achievementsListPage,
  achievementFormPage,
} = require('../views/bk');
const { pushFlash } = require('../views/layout');

const CASE_JOIN = `
  SELECT bk_cases.*, students.name AS student_name, students.nis, classes.name AS class_name
  FROM bk_cases
  JOIN students ON students.id = bk_cases.student_id
  LEFT JOIN classes ON classes.id = students.class_id
`;

module.exports = function registerBkRoutes(app) {
  // Data BK sensitif: hanya guru_bk (kelola penuh), admin, kepala_sekolah, wali_kelas (rekap saja)
  app.get('/bk', requireAuth, requireRole('admin', 'guru_bk', 'wali_kelas', 'kepala_sekolah'), (req, res) => {
    let sql = CASE_JOIN;
    const params = [];
    if (req.user.role_name === 'wali_kelas') {
      const kelas = db.get('SELECT id FROM classes WHERE wali_kelas_teacher_id = ?', [req.user.teacher_id]);
      sql += ' WHERE students.class_id = ?';
      params.push(kelas ? kelas.id : -1);
    }
    sql += ' ORDER BY bk_cases.date DESC, bk_cases.id DESC';
    const cases = db.all(sql, params);
    res.send(bkIndexPage(req, cases, req.user.role_name === 'guru_bk'));
  });

  app.get('/bk/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const students = db.all(
      `SELECT students.*, classes.name AS class_name FROM students
       LEFT JOIN classes ON classes.id = students.class_id ORDER BY students.name`
    );
    res.send(bkFormPage(req, { students }));
  });

  app.post('/bk/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const { student_id, case_type, date, description, status } = req.body;
    db.run(
      `INSERT INTO bk_cases (student_id, teacher_id, case_type, description, status, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, req.user.teacher_id, case_type, description, status || 'Baru', date]
    );
    logActivity(req.user.id, 'CREATE_BK_CASE', `Kasus ${case_type} untuk siswa #${student_id}`);
    pushFlash(req, 'success', 'Kasus BK berhasil dicatat.');
    res.redirect('/bk');
  });

  app.get('/bk/violations', requireAuth, requireRole('admin', 'guru_bk', 'wali_kelas', 'kepala_sekolah'), (req, res) => {
    const violations = db.all(`
      SELECT student_violations.*, students.name AS student_name, students.nis, teachers.name AS teacher_name
      FROM student_violations
      JOIN students ON students.id = student_violations.student_id
      JOIN teachers ON teachers.id = student_violations.teacher_id
      ORDER BY student_violations.date DESC
    `);
    res.send(violationsListPage(req, violations, req.user.role_name === 'guru_bk'));
  });

  app.get('/bk/violations/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const students = db.all('SELECT * FROM students ORDER BY name');
    res.send(violationFormPage(req, { students }));
  });

  app.post('/bk/violations/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const { student_id, date, description, point } = req.body;
    db.run(
      `INSERT INTO student_violations (student_id, teacher_id, description, point, date) VALUES (?, ?, ?, ?, ?)`,
      [student_id, req.user.teacher_id, description, point || 0, date]
    );
    logActivity(req.user.id, 'CREATE_VIOLATION', `Pelanggaran siswa #${student_id}`);
    pushFlash(req, 'success', 'Data pelanggaran berhasil dicatat.');
    res.redirect('/bk/violations');
  });

  app.get('/bk/achievements', requireAuth, requireRole('admin', 'guru_bk', 'wali_kelas', 'kepala_sekolah'), (req, res) => {
    const achievements = db.all(`
      SELECT student_achievements.*, students.name AS student_name, students.nis
      FROM student_achievements
      JOIN students ON students.id = student_achievements.student_id
      ORDER BY student_achievements.date DESC
    `);
    res.send(achievementsListPage(req, achievements, req.user.role_name === 'guru_bk'));
  });

  app.get('/bk/achievements/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const students = db.all('SELECT * FROM students ORDER BY name');
    res.send(achievementFormPage(req, { students }));
  });

  app.post('/bk/achievements/create', requireAuth, requireRole('guru_bk'), (req, res) => {
    const { student_id, date, description, level } = req.body;
    db.run(`INSERT INTO student_achievements (student_id, description, level, date) VALUES (?, ?, ?, ?)`, [
      student_id,
      description,
      level,
      date,
    ]);
    logActivity(req.user.id, 'CREATE_ACHIEVEMENT', `Prestasi siswa #${student_id}`);
    pushFlash(req, 'success', 'Data prestasi berhasil dicatat.');
    res.redirect('/bk/achievements');
  });

  // NOTE: rute dengan parameter dinamis (/bk/:id) diletakkan PALING BAWAH
  // supaya tidak menangkap path statis seperti /bk/violations atau /bk/achievements.
  app.get('/bk/:id', requireAuth, requireRole('admin', 'guru_bk', 'wali_kelas', 'kepala_sekolah'), (req, res) => {
    const bkCase = db.get(CASE_JOIN + ' WHERE bk_cases.id = ?', [req.params.id]);
    if (!bkCase) return res.status(404).send('Kasus tidak ditemukan');
    const notes = db.all(
      `SELECT bk_counseling_notes.*, teachers.name AS teacher_name FROM bk_counseling_notes
       JOIN teachers ON teachers.id = bk_counseling_notes.teacher_id
       WHERE student_id = ? ORDER BY date DESC`,
      [bkCase.student_id]
    );
    res.send(bkDetailPage(req, bkCase, notes, req.user.role_name === 'guru_bk'));
  });

  app.post('/bk/:id/notes', requireAuth, requireRole('guru_bk'), (req, res) => {
    const bkCase = db.get('SELECT * FROM bk_cases WHERE id = ?', [req.params.id]);
    if (!bkCase) return res.status(404).send('Kasus tidak ditemukan');
    const { date, notes, follow_up } = req.body;
    db.run(
      `INSERT INTO bk_counseling_notes (student_id, teacher_id, notes, follow_up, date) VALUES (?, ?, ?, ?, ?)`,
      [bkCase.student_id, req.user.teacher_id, notes, follow_up, date]
    );
    logActivity(req.user.id, 'CREATE_COUNSELING_NOTE', `Catatan untuk siswa #${bkCase.student_id}`);
    pushFlash(req, 'success', 'Catatan konseling berhasil ditambahkan.');
    res.redirect('/bk/' + req.params.id);
  });
};
