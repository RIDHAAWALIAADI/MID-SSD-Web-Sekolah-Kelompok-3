const db = require('../db');
const { verifyPassword, logActivity } = require('../lib/auth');
const { loginPage } = require('../views/login');
const { popFlash, pushFlash } = require('../views/layout');

module.exports = function registerAuthRoutes(app) {
  app.get('/', (req, res) => {
    res.redirect(req.session.userId ? '/dashboard' : '/login');
  });

  app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.send(loginPage(popFlash(req)));
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.get(
      `SELECT users.*, roles.name AS role_name FROM users
       JOIN roles ON roles.id = users.role_id WHERE users.email = ?`,
      [email]
    );

    if (!user || !user.is_active || !verifyPassword(password || '', user.password_hash)) {
      pushFlash(req, 'error', 'Email atau password salah, atau akun tidak aktif.');
      return res.redirect('/login');
    }

    req.session.userId = user.id;
    logActivity(user.id, 'LOGIN', `${user.email} login ke sistem`);
    res.redirect('/dashboard');
  });

  app.post('/logout', (req, res) => {
    if (req.session.userId) {
      logActivity(req.session.userId, 'LOGOUT', 'User logout');
    }
    req.session.userId = null;
    res.redirect('/login');
  });
};
