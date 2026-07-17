const { renderLayout, popFlash, esc } = require('./layout');

const STATUS_BADGE = {
  Aktif: 'success',
  Pindah: 'warning',
  Lulus: 'info',
  Keluar: 'danger',
};

function studentsListPage(req, students, canManage) {
  const rows = students
    .map(
      (s) => `<tr>
        <td>${esc(s.nis)}</td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.class_name || '-')}</td>
        <td>${esc(s.gender)}</td>
        <td><span class="badge bg-${STATUS_BADGE[s.status] || 'secondary'}">${esc(s.status)}</span></td>
        <td class="text-nowrap">
          <a href="/students/${s.id}" class="btn btn-sm btn-outline-secondary">Detail</a>
          ${canManage ? `<a href="/students/${s.id}/edit" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="POST" action="/students/${s.id}/delete" class="d-inline" onsubmit="return confirm('Hapus data siswa ini?')">
            <button class="btn btn-sm btn-outline-danger">Hapus</button>
          </form>` : ''}
        </td>
      </tr>`
    )
    .join('');

  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Data Kesiswaan</h2>
    ${canManage ? `<div>
      <a href="/students/export" class="btn btn-outline-secondary">Export CSV</a>
      <a href="/students/create" class="btn btn-primary">+ Tambah Siswa</a>
    </div>` : ''}
  </div>
  <table class="table table-bordered bg-white">
    <thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>JK</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="text-center text-muted">Belum ada data</td></tr>'}</tbody>
  </table>`;

  return renderLayout({ title: 'Data Kesiswaan', user: req.user, body, flash: popFlash(req) });
}

function studentDetailPage(req, student, violations, achievements) {
  const vRows = violations
    .map((v) => `<tr><td>${esc(v.date)}</td><td>${esc(v.description)}</td><td>${v.point}</td></tr>`)
    .join('');
  const aRows = achievements
    .map((a) => `<tr><td>${esc(a.date)}</td><td>${esc(a.description)}</td><td>${esc(a.level)}</td></tr>`)
    .join('');

  const body = `
  <h2 class="mb-1">${esc(student.name)}</h2>
  <p class="text-muted">NIS ${esc(student.nis)} &middot; Kelas ${esc(student.class_name || '-')} &middot;
    <span class="badge bg-${STATUS_BADGE[student.status] || 'secondary'}">${esc(student.status)}</span>
  </p>
  <div class="row">
    <div class="col-md-6">
      <div class="card mb-3"><div class="card-body">
        <h6>Data Diri</h6>
        <table class="table table-sm mb-0">
          <tr><th>Jenis Kelamin</th><td>${esc(student.gender)}</td></tr>
          <tr><th>Tanggal Lahir</th><td>${esc(student.birth_date)}</td></tr>
          <tr><th>Nama Orang Tua</th><td>${esc(student.parent_name)}</td></tr>
        </table>
      </div></div>
    </div>
    <div class="col-md-6">
      <div class="card mb-3"><div class="card-body">
        <h6>Riwayat Pelanggaran</h6>
        <table class="table table-sm mb-0"><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Poin</th></tr></thead>
        <tbody>${vRows || '<tr><td colspan="3" class="text-muted">Tidak ada</td></tr>'}</tbody></table>
      </div></div>
      <div class="card"><div class="card-body">
        <h6>Prestasi</h6>
        <table class="table table-sm mb-0"><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Tingkat</th></tr></thead>
        <tbody>${aRows || '<tr><td colspan="3" class="text-muted">Tidak ada</td></tr>'}</tbody></table>
      </div></div>
    </div>
  </div>
  <a href="/students" class="btn btn-link">&larr; Kembali</a>`;

  return renderLayout({ title: 'Detail Siswa', user: req.user, body, flash: popFlash(req) });
}

function studentFormPage(req, { classes, editStudent }) {
  const classOptions = classes
    .map((c) => `<option value="${c.id}" ${editStudent && editStudent.class_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`)
    .join('');

  const body = `
  <h2>${editStudent ? 'Edit' : 'Tambah'} Siswa</h2>
  <form method="POST" action="${editStudent ? '/students/' + editStudent.id + '/update' : '/students/create'}" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3"><label class="form-label">NIS</label>
      <input class="form-control" name="nis" required value="${editStudent ? esc(editStudent.nis) : ''}"></div>
    <div class="mb-3"><label class="form-label">Nama</label>
      <input class="form-control" name="name" required value="${editStudent ? esc(editStudent.name) : ''}"></div>
    <div class="mb-3"><label class="form-label">Kelas</label>
      <select class="form-select" name="class_id" required>${classOptions}</select></div>
    <div class="mb-3"><label class="form-label">Jenis Kelamin</label>
      <select class="form-select" name="gender">
        <option value="L" ${editStudent && editStudent.gender === 'L' ? 'selected' : ''}>Laki-laki</option>
        <option value="P" ${editStudent && editStudent.gender === 'P' ? 'selected' : ''}>Perempuan</option>
      </select></div>
    <div class="mb-3"><label class="form-label">Tanggal Lahir</label>
      <input type="date" class="form-control" name="birth_date" value="${editStudent ? esc(editStudent.birth_date) : ''}"></div>
    <div class="mb-3"><label class="form-label">Nama Orang Tua</label>
      <input class="form-control" name="parent_name" value="${editStudent ? esc(editStudent.parent_name) : ''}"></div>
    <div class="mb-3"><label class="form-label">Status</label>
      <select class="form-select" name="status">
        ${['Aktif', 'Pindah', 'Lulus', 'Keluar'].map((s) => `<option ${editStudent && editStudent.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/students" class="btn btn-link">Batal</a>
  </form>`;

  return renderLayout({ title: 'Form Siswa', user: req.user, body, flash: popFlash(req) });
}

function classesListPage(req, classes) {
  const rows = classes
    .map(
      (c) => `<tr>
        <td>${esc(c.name)}</td>
        <td>${esc(c.wali_name || '-')}</td>
        <td>${esc(c.academic_year || '-')}</td>
        <td>${c.student_count}</td>
        <td><a href="/classes/${c.id}/edit" class="btn btn-sm btn-outline-primary">Edit</a></td>
      </tr>`
    )
    .join('');

  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Data Kelas</h2>
    <a href="/classes/create" class="btn btn-primary">+ Tambah Kelas</a>
  </div>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Nama Kelas</th><th>Wali Kelas</th><th>Tahun Ajaran</th><th>Jumlah Siswa</th><th>Aksi</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">Belum ada data</td></tr>'}</tbody>
  </table>`;

  return renderLayout({ title: 'Data Kelas', user: req.user, body, flash: popFlash(req) });
}

function classFormPage(req, { teachers, academicYears, editClass }) {
  const teacherOptions =
    '<option value="">-</option>' +
    teachers.map((t) => `<option value="${t.id}" ${editClass && editClass.wali_kelas_teacher_id === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  const ayOptions = academicYears
    .map((a) => `<option value="${a.id}" ${editClass && editClass.academic_year_id === a.id ? 'selected' : ''}>${esc(a.name)}</option>`)
    .join('');

  const body = `
  <h2>${editClass ? 'Edit' : 'Tambah'} Kelas</h2>
  <form method="POST" action="${editClass ? '/classes/' + editClass.id + '/update' : '/classes/create'}" class="card p-4 bg-white" style="max-width:500px">
    <div class="mb-3"><label class="form-label">Nama Kelas</label>
      <input class="form-control" name="name" required value="${editClass ? esc(editClass.name) : ''}"></div>
    <div class="mb-3"><label class="form-label">Wali Kelas</label>
      <select class="form-select" name="wali_kelas_teacher_id">${teacherOptions}</select></div>
    <div class="mb-3"><label class="form-label">Tahun Ajaran</label>
      <select class="form-select" name="academic_year_id">${ayOptions}</select></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/classes" class="btn btn-link">Batal</a>
  </form>`;

  return renderLayout({ title: 'Form Kelas', user: req.user, body, flash: popFlash(req) });
}

module.exports = { studentsListPage, studentDetailPage, studentFormPage, classesListPage, classFormPage };
