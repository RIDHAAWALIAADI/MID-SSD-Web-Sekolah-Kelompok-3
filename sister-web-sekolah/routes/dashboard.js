const db = require('../db');
const { requireAuth } = require('../lib/auth');
const { dashboardPage } = require('../views/dashboard');

module.exports = function registerDashboardRoutes(app) {
  app.get('/dashboard', requireAuth, (req, res) => {
    const user = req.user;
    const stats = {};

    if (user.role_name === 'admin') {
      stats.userCount = db.get('SELECT COUNT(*) c FROM users').c;
      stats.studentCount = db.get('SELECT COUNT(*) c FROM students').c;
      stats.classCount = db.get('SELECT COUNT(*) c FROM classes').c;
      stats.journalCount = db.get(
        `SELECT COUNT(*) c FROM teaching_journals WHERE date >= date('now','-30 day')`
      ).c;
    } else if (user.role_name === 'guru') {
      stats.myJournalCount = db.get(
        `SELECT COUNT(*) c FROM teaching_journals WHERE teacher_id = ? AND date >= date('now','-30 day')`,
        [user.teacher_id]
      ).c;
    } else if (user.role_name === 'guru_bk') {
      stats.activeCases = db.get(`SELECT COUNT(*) c FROM bk_cases WHERE status != 'Selesai'`).c;
      stats.totalCases = db.get(`SELECT COUNT(*) c FROM bk_cases`).c;
    } else if (user.role_name === 'wali_kelas') {
      const kelas = db.get('SELECT id FROM classes WHERE wali_kelas_teacher_id = ?', [user.teacher_id]);
      stats.classStudentCount = kelas ? db.get('SELECT COUNT(*) c FROM students WHERE class_id = ?', [kelas.id]).c : 0;
    } else if (user.role_name === 'kepala_sekolah') {
      stats.studentCount = db.get('SELECT COUNT(*) c FROM students').c;
      stats.teacherCount = db.get('SELECT COUNT(*) c FROM teachers').c;
      stats.journalCount = db.get(`SELECT COUNT(*) c FROM teaching_journals WHERE date >= date('now','-30 day')`).c;
      stats.bkThisMonth = db.get(`SELECT COUNT(*) c FROM bk_cases WHERE date >= date('now','-30 day')`).c;
    }

    res.send(dashboardPage(req, stats));
  });
};
