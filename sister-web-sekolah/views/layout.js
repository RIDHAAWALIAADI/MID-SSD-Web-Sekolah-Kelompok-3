/**
 * views/layout.js
 * Shell HTML bersama (navbar berbasis role + flash message) dipakai
 * oleh semua halaman. Styling pakai Bootstrap 5 via CDN (tidak perlu
 * npm install apa pun untuk frontend).
 */

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAV_BY_ROLE = {
  admin: [
    ['/dashboard', 'Dashboard'],
    ['/users', 'Manajemen Pengguna'],
    ['/students', 'Data Kesiswaan'],
    ['/classes', 'Kelas'],
    ['/journal', 'Jurnal Mengajar'],
    ['/bk', 'BK'],
    ['/logs', 'Log Aktivitas'],
  ],
  guru: [
    ['/dashboard', 'Dashboard'],
    ['/journal', 'Jurnal Mengajar'],
  ],
  guru_bk: [
    ['/dashboard', 'Dashboard'],
    ['/bk', 'BK'],
    ['/students', 'Data Siswa'],
  ],
  wali_kelas: [
    ['/dashboard', 'Dashboard'],
    ['/students', 'Siswa Kelas Saya'],
    ['/journal', 'Jurnal Mengajar'],
    ['/bk', 'Rekap BK'],
  ],
  kepala_sekolah: [
    ['/dashboard', 'Dashboard'],
    ['/journal', 'Rekap Jurnal'],
    ['/bk', 'Rekap BK'],
    ['/students', 'Data Kesiswaan'],
  ],
  siswa: [['/dashboard', 'Dashboard']],
  orang_tua: [['/dashboard', 'Dashboard']],
};

const ROLE_LABEL = {
  admin: 'Admin',
  guru: 'Guru',
  guru_bk: 'Guru BK',
  wali_kelas: 'Wali Kelas',
  kepala_sekolah: 'Kepala Sekolah',
  siswa: 'Siswa',
  orang_tua: 'Orang Tua',
};

function renderLayout({ title, user, body, flash }) {
  const nav = user ? (NAV_BY_ROLE[user.role_name] || []) : [];
  const navHtml = nav
    .map(([href, label]) => `<a class="nav-link" href="${href}">${esc(label)}</a>`)
    .join('');

  const flashHtml = (flash || [])
    .map(
      (f) =>
        `<div class="alert alert-${f.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show" role="alert">
          ${esc(f.message)}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`
    )
    .join('');

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title || 'SISTER')} - Sistem Informasi Sekolah Terintegrasi</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/public/style.css" rel="stylesheet">
</head>
<body class="bg-light">
  ${user ? `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container-fluid">
      <a class="navbar-brand" href="/dashboard">SISTER <small class="fs-6 text-secondary">| Sekolah Terintegrasi</small></a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMain">
        <div class="navbar-nav me-auto">${navHtml}</div>
        <span class="navbar-text text-white me-3">${esc(user.name)} <span class="badge bg-info">${esc(ROLE_LABEL[user.role_name] || user.role_name)}</span></span>
        <form method="POST" action="/logout" class="d-inline">
          <button class="btn btn-sm btn-outline-light">Logout</button>
        </form>
      </div>
    </div>
  </nav>` : ''}
  <div class="container pb-5">
    ${flashHtml}
    ${body}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function popFlash(req) {
  const flash = req.session.flash || [];
  req.session.flash = [];
  return flash;
}

function pushFlash(req, type, message) {
  if (!req.session.flash) req.session.flash = [];
  req.session.flash.push({ type, message });
}

module.exports = { renderLayout, popFlash, pushFlash, esc, ROLE_LABEL };
