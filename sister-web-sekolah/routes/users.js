const db = require('../db');
const { requireAuth, requireRole, hashPassword, logActivity } = require('../lib/auth');
const { usersListPage, userFormPage, logsPage } = require('../views/users');
const { pushFlash } = require('../views/layout');

module.exports = function registerUserRoutes(app) {
  app.get('/users', requireAuth, requireRole('admin'), (req, res) => {
    const users = db.all(
      `SELECT users.*, roles.name AS role_name FROM users
       JOIN roles ON roles.id = users.role_id ORDER BY users.id`
    );
    res.send(usersListPage(req, users));
  });

  app.get('/users/create', requireAuth, requireRole('admin'), (req, res) => {
    const roles = db.all('SELECT * FROM roles ORDER BY name');
    const teachers = db.all('SELECT * FROM teachers ORDER BY name');
    const students = db.all('SELECT * FROM students ORDER BY name');
    res.send(userFormPage(req, { roles, teachers, students, editUser: null }));
  });

  app.post('/users/create', requireAuth, requireRole('admin'), (req, res) => {
    const { name, email, password, role_id, teacher_id, student_id } = req.body;
    try {
      db.run(
        `INSERT INTO users (name, email, password_hash, role_id, teacher_id, student_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [name, email, hashPassword(password), role_id, teacher_id || null, student_id || null]
      );
      logActivity(req.user.id, 'CREATE_USER', `Menambahkan pengguna ${email}`);
      pushFlash(req, 'success', 'Pengguna berhasil ditambahkan.');
    } catch (e) {
      pushFlash(req, 'error', 'Gagal menambahkan pengguna: ' + e.message);
    }
    res.redirect('/users');
  });

  app.get('/users/:id/edit', requireAuth, requireRole('admin'), (req, res) => {
    const editUser = db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!editUser) return res.status(404).send('User tidak ditemukan');
    const roles = db.all('SELECT * FROM roles ORDER BY name');
    const teachers = db.all('SELECT * FROM teachers ORDER BY name');
    const students = db.all('SELECT * FROM students ORDER BY name');
    res.send(userFormPage(req, { roles, teachers, students, editUser }));
  });

  app.post('/users/:id/update', requireAuth, requireRole('admin'), (req, res) => {
    const { name, email, password, role_id, teacher_id, student_id } = req.body;
    try {
      if (password) {
        db.run(
          `UPDATE users SET name=?, email=?, password_hash=?, role_id=?, teacher_id=?, student_id=? WHERE id=?`,
          [name, email, hashPassword(password), role_id, teacher_id || null, student_id || null, req.params.id]
        );
      } else {
        db.run(
          `UPDATE users SET name=?, email=?, role_id=?, teacher_id=?, student_id=? WHERE id=?`,
          [name, email, role_id, teacher_id || null, student_id || null, req.params.id]
        );
      }
      logActivity(req.user.id, 'UPDATE_USER', `Mengubah pengguna #${req.params.id}`);
      pushFlash(req, 'success', 'Pengguna berhasil diperbarui.');
    } catch (e) {
      pushFlash(req, 'error', 'Gagal memperbarui pengguna: ' + e.message);
    }
    res.redirect('/users');
  });

  app.post('/users/:id/toggle', requireAuth, requireRole('admin'), (req, res) => {
    const target = db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (target) {
      db.run('UPDATE users SET is_active = ? WHERE id = ?', [target.is_active ? 0 : 1, req.params.id]);
      logActivity(req.user.id, 'TOGGLE_USER', `${target.is_active ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna #${req.params.id}`);
    }
    res.redirect('/users');
  });

  app.get('/logs', requireAuth, requireRole('admin'), (req, res) => {
    const logs = db.all(
      `SELECT activity_logs.*, users.name AS user_name FROM activity_logs
       LEFT JOIN users ON users.id = activity_logs.user_id
       ORDER BY activity_logs.id DESC LIMIT 200`
    );
    res.send(logsPage(req, logs));
  });
};
