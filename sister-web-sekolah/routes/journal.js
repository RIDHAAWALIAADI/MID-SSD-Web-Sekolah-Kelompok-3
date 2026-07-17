const db = require('../db');
const { requireAuth, requireRole, logActivity } = require('../lib/auth');
const { journalListPage, journalFormPage } = require('../views/journal');
const { pushFlash } = require('../views/layout');

const JOIN_SQL = `
  SELECT teaching_journals.*, teachers.name AS teacher_name,
         classes.name AS class_name, subjects.name AS subject_name
  FROM teaching_journals
  JOIN teachers ON teachers.id = teaching_journals.teacher_id
  JOIN classes ON classes.id = teaching_journals.class_id
  JOIN subjects ON subjects.id = teaching_journals.subject_id
`;

module.exports = function registerJournalRoutes(app) {
  app.get(
    '/journal',
    requireAuth,
    requireRole('admin', 'guru', 'wali_kelas', 'kepala_sekolah'),
    (req, res) => {
      let sql = JOIN_SQL;
      const params = [];
      const conditions = [];

      if (req.user.role_name === 'guru') {
        conditions.push('teaching_journals.teacher_id = ?');
        params.push(req.user.teacher_id);
      } else if (req.user.role_name === 'wali_kelas') {
        const kelas = db.get('SELECT id FROM classes WHERE wali_kelas_teacher_id = ?', [req.user.teacher_id]);
        conditions.push('teaching_journals.class_id = ?');
        params.push(kelas ? kelas.id : -1);
      }

      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY teaching_journals.date DESC, teaching_journals.id DESC';

      const journals = db.all(sql, params);
      const canCreate = req.user.role_name === 'guru';
      const canManage = req.user.role_name === 'guru' || req.user.role_name === 'admin';
      res.send(journalListPage(req, journals, canCreate, canManage));
    }
  );

  app.get('/journal/create', requireAuth, requireRole('guru'), (req, res) => {
    const classes = db.all('SELECT * FROM classes ORDER BY name');
    const subjects = db.all('SELECT * FROM subjects ORDER BY name');
    res.send(journalFormPage(req, { classes, subjects, editJournal: null }));
  });

  app.post('/journal/create', requireAuth, requireRole('guru'), (req, res) => {
    const { class_id, subject_id, date, material, method, notes } = req.body;
    db.run(
      `INSERT INTO teaching_journals (teacher_id, class_id, subject_id, date, material, method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.teacher_id, class_id, subject_id, date, material, method, notes]
    );
    logActivity(req.user.id, 'CREATE_JOURNAL', `Jurnal ${date} kelas #${class_id}`);
    pushFlash(req, 'success', 'Jurnal mengajar berhasil disimpan.');
    res.redirect('/journal');
  });

  app.get('/journal/:id/edit', requireAuth, requireRole('guru', 'admin'), (req, res) => {
    const editJournal = db.get('SELECT * FROM teaching_journals WHERE id = ?', [req.params.id]);
    if (!editJournal) return res.status(404).send('Jurnal tidak ditemukan');
    if (req.user.role_name === 'guru' && editJournal.teacher_id !== req.user.teacher_id) {
      return res.status(403).send('Anda hanya dapat mengubah jurnal milik Anda sendiri.');
    }
    const classes = db.all('SELECT * FROM classes ORDER BY name');
    const subjects = db.all('SELECT * FROM subjects ORDER BY name');
    res.send(journalFormPage(req, { classes, subjects, editJournal }));
  });

  app.post('/journal/:id/update', requireAuth, requireRole('guru', 'admin'), (req, res) => {
    const existing = db.get('SELECT * FROM teaching_journals WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).send('Jurnal tidak ditemukan');
    if (req.user.role_name === 'guru' && existing.teacher_id !== req.user.teacher_id) {
      return res.status(403).send('Anda hanya dapat mengubah jurnal milik Anda sendiri.');
    }
    const { class_id, subject_id, date, material, method, notes } = req.body;
    db.run(
      `UPDATE teaching_journals SET class_id=?, subject_id=?, date=?, material=?, method=?, notes=? WHERE id=?`,
      [class_id, subject_id, date, material, method, notes, req.params.id]
    );
    logActivity(req.user.id, 'UPDATE_JOURNAL', `Mengubah jurnal #${req.params.id}`);
    pushFlash(req, 'success', 'Jurnal berhasil diperbarui.');
    res.redirect('/journal');
  });

  app.post('/journal/:id/delete', requireAuth, requireRole('guru', 'admin'), (req, res) => {
    const existing = db.get('SELECT * FROM teaching_journals WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).send('Jurnal tidak ditemukan');
    if (req.user.role_name === 'guru' && existing.teacher_id !== req.user.teacher_id) {
      return res.status(403).send('Anda hanya dapat menghapus jurnal milik Anda sendiri.');
    }
    db.run('DELETE FROM teaching_journals WHERE id = ?', [req.params.id]);
    logActivity(req.user.id, 'DELETE_JOURNAL', `Menghapus jurnal #${req.params.id}`);
    pushFlash(req, 'success', 'Jurnal berhasil dihapus.');
    res.redirect('/journal');
  });
};
