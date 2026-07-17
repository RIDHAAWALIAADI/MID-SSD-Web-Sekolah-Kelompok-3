const { renderLayout, popFlash, esc } = require('./layout');

function usersListPage(req, users) {
  const rows = users
    .map(
      (u) => `<tr>
        <td>${u.id}</td>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="badge bg-secondary">${esc(u.role_name)}</span></td>
        <td>${u.is_active ? '<span class="badge bg-success">Aktif</span>' : '<span class="badge bg-danger">Nonaktif</span>'}</td>
        <td class="text-nowrap">
          <a href="/users/${u.id}/edit" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="POST" action="/users/${u.id}/toggle" class="d-inline">
            <button class="btn btn-sm btn-outline-warning">${u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
          </form>
        </td>
      </tr>`
    )
    .join('');

  const body = `
<div class="page-card">

    <div class="page-header">
        <div>
            <h2>👥 Manajemen Pengguna</h2>
            <p>Kelola seluruh akun pengguna sistem sekolah.</p>
        </div>

        <a href="/users/create" class="btn btn-primary btn-modern">
            <i class="bi bi-plus-circle"></i> Tambah Pengguna
        </a>
    </div>

    <div class="table-responsive mt-4">

        <table class="table table-modern align-middle">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th width="180">Aksi</th>
                </tr>
            </thead>

            <tbody>
                ${
                  rows ||
                  `<tr>
                      <td colspan="6" class="text-center py-5 text-muted">
                          Belum ada data pengguna
                      </td>
                  </tr>`
                }
            </tbody>

        </table>

    </div>

</div>
`;

  return renderLayout({ title: 'Manajemen Pengguna', user: req.user, body, flash: popFlash(req) });
}

function userFormPage(req, { roles, teachers, students, editUser }) {
  const roleOptions = roles
    .map((r) => `<option value="${r.id}" ${editUser && editUser.role_id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`)
    .join('');
  const teacherOptions =
    '<option value="">-</option>' +
    teachers.map((t) => `<option value="${t.id}" ${editUser && editUser.teacher_id === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  const studentOptions =
    '<option value="">-</option>' +
    students.map((s) => `<option value="${s.id}" ${editUser && editUser.student_id === s.id ? 'selected' : ''}>${esc(s.name)} (${esc(s.nis)})</option>`).join('');

  const body = `
  <h2>${editUser ? 'Edit' : 'Tambah'} Pengguna</h2>
  <form method="POST" action="${editUser ? '/users/' + editUser.id + '/update' : '/users/create'}" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3">
      <label class="form-label">Nama</label>
      <input class="form-control" name="name" required value="${editUser ? esc(editUser.name) : ''}">
    </div>
    <div class="mb-3">
      <label class="form-label">Email</label>
      <input type="email" class="form-control" name="email" required value="${editUser ? esc(editUser.email) : ''}">
    </div>
    <div class="mb-3">
      <label class="form-label">Password ${editUser ? '(kosongkan jika tidak diubah)' : ''}</label>
      <input type="password" class="form-control" name="password" ${editUser ? '' : 'required'}>
    </div>
    <div class="mb-3">
      <label class="form-label">Role</label>
      <select class="form-select" name="role_id" required>${roleOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Guru terkait (untuk role guru/guru_bk/wali_kelas)</label>
      <select class="form-select" name="teacher_id">${teacherOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Siswa terkait (untuk role siswa)</label>
      <select class="form-select" name="student_id">${studentOptions}</select>
    </div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/users" class="btn btn-link">Batal</a>
  </form>`;

  return renderLayout({ title: 'Form Pengguna', user: req.user, body, flash: popFlash(req) });
}

function logsPage(req, logs) {
  const rows = logs
    .map(
      (l) => `<tr>
        <td>${esc(l.created_at)}</td>
        <td>${esc(l.user_name || 'System')}</td>
        <td><span class="badge bg-dark">${esc(l.action)}</span></td>
        <td>${esc(l.detail)}</td>
      </tr>`
    )
    .join('');

  const body = `
  <h2 class="mb-3">Log Aktivitas Pengguna</h2>
  <p class="text-muted">Audit trail seluruh aktivitas penting (login, tambah/ubah/hapus data) untuk kebutuhan monitoring &amp; keamanan.</p>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Detail</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">Belum ada log</td></tr>'}</tbody>
  </table>`;

  return renderLayout({ title: 'Log Aktivitas', user: req.user, body, flash: popFlash(req) });
}

module.exports = { usersListPage, userFormPage, logsPage };
