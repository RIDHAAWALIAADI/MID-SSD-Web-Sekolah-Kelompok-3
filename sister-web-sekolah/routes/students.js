const db = require('../db');
const { requireAuth, requireRole, logActivity } = require('../lib/auth');
const {
  studentsListPage,
  studentDetailPage,
  studentFormPage,
  classesListPage,
  classFormPage,
} = require('../views/students');
const { pushFlash } = require('../views/layout');

module.exports = function registerStudentRoutes(app) {
  // ---------------- Data Kesiswaan ----------------
  app.get(
    '/students',
    requireAuth,
    requireRole('admin', 'guru_bk', 'wali_kelas', 'kepala_sekolah'),
    (req, res) => {
      let sql = `SELECT students.*, classes.name AS class_name FROM students
                 LEFT JOIN classes ON classes.id = students.class_id`;
      const params = [];

      // Wali kelas hanya boleh melihat siswa di kelas yang ia ampu (RBAC by ownership)
      if (req.user.role_name === 'wali_kelas') {
        const kelas = db.get('SELECT id FROM classes WHERE wali_kelas_teacher_id = ?', [req.user.teacher_id]);
        sql += ' WHERE students.class_id = ?';
        params.push(kelas ? kelas.id : -1);
      }
      sql += ' ORDER BY students.name';

      const students = db.all(sql, params);
      const canManage = req.user.role_name === 'admin';
      res.send(studentsListPage(req, students, canManage));
    }
  );

  app.get('/students/export', requireAuth, requireRole('admin'), (req, res) => {
    const students = db.all(
      `SELECT students.*, classes.name AS class_name FROM students
       LEFT JOIN classes ON classes.id = students.class_id ORDER BY students.name`
    );
    const header = 'nis,name,class_name,gender,birth_date,parent_name,status';
    const lines = students.map((s) =>
      [s.nis, s.name, s.class_name, s.gender, s.birth_date, s.parent_name, s.status].join(',')
    );
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="data-siswa.csv"');
    res.send(csv);
  });

  app.get('/students/create', requireAuth, requireRole('admin'), (req, res) => {
    const classes = db.all('SELECT * FROM classes ORDER BY name');
    res.send(studentFormPage(req, { classes, editStudent: null }));
  });

  app.post('/students/create', requireAuth, requireRole('admin'), (req, res) => {
    const { nis, name, class_id, gender, birth_date, parent_name, status } = req.body;
    try {
      db.run(
        `INSERT INTO students (nis, name, class_id, gender, birth_date, parent_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nis, name, class_id, gender, birth_date, parent_name, status || 'Aktif']
      );
      logActivity(req.user.id, 'CREATE_STUDENT', `Menambahkan siswa ${name} (${nis})`);
      pushFlash(req, 'success', 'Data siswa berhasil ditambahkan.');
    } catch (e) {
      pushFlash(req, 'error', 'Gagal menambahkan siswa: ' + e.message);
    }
    res.redirect('/students');
  });

  app.get('/students/:id', requireAuth, (req, res) => {
    const student = db.get(
      `SELECT students.*, classes.name AS class_name FROM students
       LEFT JOIN classes ON classes.id = students.class_id WHERE students.id = ?`,
      [req.params.id]
    );
    if (!student) return res.status(404).send('Siswa tidak ditemukan');
    const violations = db.all('SELECT * FROM student_violations WHERE student_id = ? ORDER BY date DESC', [req.params.id]);
    const achievements = db.all('SELECT * FROM student_achievements WHERE student_id = ? ORDER BY date DESC', [req.params.id]);
    res.send(studentDetailPage(req, student, violations, achievements));
  });

  app.get('/students/:id/edit', requireAuth, requireRole('admin'), (req, res) => {
    const editStudent = db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!editStudent) return res.status(404).send('Siswa tidak ditemukan');
    const classes = db.all('SELECT * FROM classes ORDER BY name');
    res.send(studentFormPage(req, { classes, editStudent }));
  });

  app.post('/students/:id/update', requireAuth, requireRole('admin'), (req, res) => {
    const { nis, name, class_id, gender, birth_date, parent_name, status } = req.body;
    db.run(
      `UPDATE students SET nis=?, name=?, class_id=?, gender=?, birth_date=?, parent_name=?, status=? WHERE id=?`,
      [nis, name, class_id, gender, birth_date, parent_name, status, req.params.id]
    );
    logActivity(req.user.id, 'UPDATE_STUDENT', `Mengubah siswa #${req.params.id}`);
    pushFlash(req, 'success', 'Data siswa berhasil diperbarui.');
    res.redirect('/students');
  });

  app.post('/students/:id/delete', requireAuth, requireRole('admin'), (req, res) => {
    try {
      db.run('DELETE FROM students WHERE id = ?', [req.params.id]);
      logActivity(req.user.id, 'DELETE_STUDENT', `Menghapus siswa #${req.params.id}`);
      pushFlash(req, 'success', 'Data siswa berhasil dihapus.');
    } catch (e) {
      pushFlash(req, 'error', 'Tidak dapat menghapus: siswa masih memiliki data terkait (jurnal/BK). Ubah status menjadi "Keluar" sebagai alternatif.');
    }
    res.redirect('/students');
  });

  // ---------------- Data Kelas ----------------
  app.get('/classes', requireAuth, requireRole('admin'), (req, res) => {
    const classes = db.all(`
      SELECT classes.*, teachers.name AS wali_name, academic_years.name AS academic_year,
        (SELECT COUNT(*) FROM students WHERE students.class_id = classes.id) AS student_count
      FROM classes
      LEFT JOIN teachers ON teachers.id = classes.wali_kelas_teacher_id
      LEFT JOIN academic_years ON academic_years.id = classes.academic_year_id
      ORDER BY classes.name
    `);
    res.send(classesListPage(req, classes));
  });

  app.get('/classes/create', requireAuth, requireRole('admin'), (req, res) => {
    const teachers = db.all('SELECT * FROM teachers ORDER BY name');
    const academicYears = db.all('SELECT * FROM academic_years ORDER BY name');
    res.send(classFormPage(req, { teachers, academicYears, editClass: null }));
  });

  app.post('/classes/create', requireAuth, requireRole('admin'), (req, res) => {
    const { name, wali_kelas_teacher_id, academic_year_id } = req.body;
    db.run('INSERT INTO classes (name, wali_kelas_teacher_id, academic_year_id) VALUES (?, ?, ?)', [
      name,
      wali_kelas_teacher_id || null,
      academic_year_id || null,
    ]);
    logActivity(req.user.id, 'CREATE_CLASS', `Menambahkan kelas ${name}`);
    pushFlash(req, 'success', 'Kelas berhasil ditambahkan.');
    res.redirect('/classes');
  });

  app.get('/classes/:id/edit', requireAuth, requireRole('admin'), (req, res) => {
    const editClass = db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!editClass) return res.status(404).send('Kelas tidak ditemukan');
    const teachers = db.all('SELECT * FROM teachers ORDER BY name');
    const academicYears = db.all('SELECT * FROM academic_years ORDER BY name');
    res.send(classFormPage(req, { teachers, academicYears, editClass }));
  });

  app.post('/classes/:id/update', requireAuth, requireRole('admin'), (req, res) => {
    const { name, wali_kelas_teacher_id, academic_year_id } = req.body;
    db.run('UPDATE classes SET name=?, wali_kelas_teacher_id=?, academic_year_id=? WHERE id=?', [
      name,
      wali_kelas_teacher_id || null,
      academic_year_id || null,
      req.params.id,
    ]);
    logActivity(req.user.id, 'UPDATE_CLASS', `Mengubah kelas #${req.params.id}`);
    pushFlash(req, 'success', 'Kelas berhasil diperbarui.');
    res.redirect('/classes');
  });
};
