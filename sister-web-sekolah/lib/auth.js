/**
 * lib/auth.js
 * Modul "Manajemen Pengguna" - bagian keamanan:
 *  - hashing & verifikasi password (scrypt, bawaan Node "crypto")
 *  - middleware requireAuth & requireRole (Role-Based Access Control)
 *  - helper pencatatan activity log (audit trail)
 */

const crypto = require('crypto');
const db = require('../db');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = crypto.scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, testBuf);
}

function logActivity(userId, action, detail) {
  db.run(
    `INSERT INTO activity_logs (user_id, action, detail, created_at) VALUES (?, ?, ?, datetime('now','localtime'))`,
    [userId, action, detail || null]
  );
}

// Middleware: pastikan user sudah login
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  // muat data user + role terbaru pada setiap request
  const user = db.get(
    `SELECT users.*, roles.name AS role_name FROM users
     JOIN roles ON roles.id = users.role_id WHERE users.id = ?`,
    [req.session.userId]
  );
  if (!user || !user.is_active) {
    req.session.userId = null;
    return res.redirect('/login');
  }
  req.user = user;
  next();
}

// Middleware factory: batasi akses berdasarkan role tertentu
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role_name)) {
      res.status(403).send(
        `<h1>403 - Akses Ditolak</h1><p>Role <b>${req.user ? req.user.role_name : '-'}</b> tidak memiliki akses ke halaman ini.</p><a href="/dashboard">Kembali</a>`
      );
      return;
    }
    next();
  };
}

module.exports = { hashPassword, verifyPassword, logActivity, requireAuth, requireRole };
