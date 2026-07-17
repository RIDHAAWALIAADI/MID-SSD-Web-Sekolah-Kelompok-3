const { renderLayout, popFlash, esc } = require('./layout');

const STATUS_BADGE = { Baru: 'secondary', Proses: 'warning', Selesai: 'success' };
const TYPE_BADGE = { konseling: 'info', pelanggaran: 'danger', prestasi: 'success' };

function bkIndexPage(req, cases, canCreate) {
  const rows = cases
    .map(
      (c) => `<tr>
        <td>${esc(c.date)}</td>
        <td>${esc(c.student_name)} <span class="text-muted">(${esc(c.nis)})</span></td>
        <td>${esc(c.class_name)}</td>
        <td><span class="badge bg-${TYPE_BADGE[c.case_type] || 'secondary'}">${esc(c.case_type)}</span></td>
        <td>${esc(c.description)}</td>
        <td><span class="badge bg-${STATUS_BADGE[c.status] || 'secondary'}">${esc(c.status)}</span></td>
        <td><a href="/bk/${c.id}" class="btn btn-sm btn-outline-secondary">Detail</a></td>
      </tr>`
    )
    .join('');

  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Bimbingan Konseling (BK)</h2>
    ${canCreate ? `<a href="/bk/create" class="btn btn-primary">+ Catat Kasus</a>` : ''}
  </div>
  <p class="text-muted">Data bersifat rahasia &mdash; hanya dapat diakses oleh Guru BK, Kepala Sekolah, Wali Kelas terkait, dan Admin.</p>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link active" href="/bk">Rekap Kasus</a></li>
    <li class="nav-item"><a class="nav-link" href="/bk/violations">Pelanggaran</a></li>
    <li class="nav-item"><a class="nav-link" href="/bk/achievements">Prestasi</a></li>
  </ul>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Tanggal</th><th>Siswa</th><th>Kelas</th><th>Jenis</th><th>Keterangan</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="text-center text-muted">Belum ada data</td></tr>'}</tbody>
  </table>`;

  return renderLayout({ title: 'BK', user: req.user, body, flash: popFlash(req) });
}

function bkFormPage(req, { students }) {
  const studentOptions = students
    .map((s) => `<option value="${s.id}">${esc(s.name)} - ${esc(s.nis)} (${esc(s.class_name || '-')})</option>`)
    .join('');

  const body = `
  <h2>Catat Kasus BK</h2>
  <form method="POST" action="/bk/create" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3"><label class="form-label">Cari / Pilih Siswa</label>
      <select class="form-select" name="student_id" required>${studentOptions}</select></div>
    <div class="mb-3"><label class="form-label">Jenis Kasus</label>
      <select class="form-select" name="case_type" required>
        <option value="konseling">Konseling</option>
        <option value="pelanggaran">Pelanggaran</option>
        <option value="prestasi">Prestasi</option>
      </select></div>
    <div class="mb-3"><label class="form-label">Tanggal</label>
      <input type="date" class="form-control" name="date" required></div>
    <div class="mb-3"><label class="form-label">Deskripsi</label>
      <textarea class="form-control" name="description" required></textarea></div>
    <div class="mb-3"><label class="form-label">Status</label>
      <select class="form-select" name="status">
        <option>Baru</option><option>Proses</option><option>Selesai</option>
      </select></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/bk" class="btn btn-link">Batal</a>
  </form>`;

  return renderLayout({ title: 'Catat Kasus BK', user: req.user, body, flash: popFlash(req) });
}

function bkDetailPage(req, bkCase, notes, canManage) {
  const noteRows = notes
    .map(
      (n) => `<tr><td>${esc(n.date)}</td><td>${esc(n.notes)}</td><td>${esc(n.follow_up)}</td><td>${esc(n.teacher_name)}</td></tr>`
    )
    .join('');

  const body = `
  <h2>Detail Kasus BK</h2>
  <div class="card p-3 bg-white mb-3">
    <p><b>Siswa:</b> ${esc(bkCase.student_name)} (${esc(bkCase.nis)}) &mdash; Kelas ${esc(bkCase.class_name)}</p>
    <p><b>Jenis:</b> <span class="badge bg-${TYPE_BADGE[bkCase.case_type] || 'secondary'}">${esc(bkCase.case_type)}</span>
       &nbsp; <b>Status:</b> <span class="badge bg-${STATUS_BADGE[bkCase.status] || 'secondary'}">${esc(bkCase.status)}</span></p>
    <p><b>Tanggal:</b> ${esc(bkCase.date)}</p>
    <p><b>Deskripsi:</b> ${esc(bkCase.description)}</p>
  </div>

  <h5>Catatan Konseling &amp; Tindak Lanjut</h5>
  <table class="table table-bordered bg-white mb-3">
    <thead><tr><th>Tanggal</th><th>Catatan</th><th>Tindak Lanjut</th><th>Guru BK</th></tr></thead>
    <tbody>${noteRows || '<tr><td colspan="4" class="text-center text-muted">Belum ada catatan</td></tr>'}</tbody>
  </table>

  ${canManage ? `
  <div class="card p-4 bg-white" style="max-width:600px">
    <h6>Tambah Catatan</h6>
    <form method="POST" action="/bk/${bkCase.id}/notes">
      <div class="mb-3"><label class="form-label">Tanggal</label>
        <input type="date" class="form-control" name="date" required></div>
      <div class="mb-3"><label class="form-label">Catatan Konseling</label>
        <textarea class="form-control" name="notes" required></textarea></div>
      <div class="mb-3"><label class="form-label">Tindak Lanjut</label>
        <textarea class="form-control" name="follow_up"></textarea></div>
      <button class="btn btn-primary">Simpan Catatan</button>
    </form>
  </div>` : ''}
  <a href="/bk" class="btn btn-link mt-3">&larr; Kembali</a>`;

  return renderLayout({ title: 'Detail Kasus BK', user: req.user, body, flash: popFlash(req) });
}

function violationsListPage(req, violations, canCreate) {
  const rows = violations
    .map((v) => `<tr><td>${esc(v.date)}</td><td>${esc(v.student_name)} (${esc(v.nis)})</td><td>${esc(v.description)}</td><td>${v.point}</td><td>${esc(v.teacher_name)}</td></tr>`)
    .join('');
  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Pelanggaran Siswa</h2>
    ${canCreate ? `<a href="/bk/violations/create" class="btn btn-primary">+ Catat Pelanggaran</a>` : ''}
  </div>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link" href="/bk">Rekap Kasus</a></li>
    <li class="nav-item"><a class="nav-link active" href="/bk/violations">Pelanggaran</a></li>
    <li class="nav-item"><a class="nav-link" href="/bk/achievements">Prestasi</a></li>
  </ul>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Tanggal</th><th>Siswa</th><th>Keterangan</th><th>Poin</th><th>Dicatat oleh</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="text-center text-muted">Belum ada data</td></tr>'}</tbody>
  </table>`;
  return renderLayout({ title: 'Pelanggaran Siswa', user: req.user, body, flash: popFlash(req) });
}

function violationFormPage(req, { students }) {
  const studentOptions = students.map((s) => `<option value="${s.id}">${esc(s.name)} - ${esc(s.nis)}</option>`).join('');
  const body = `
  <h2>Catat Pelanggaran</h2>
  <form method="POST" action="/bk/violations/create" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3"><label class="form-label">Siswa</label>
      <select class="form-select" name="student_id" required>${studentOptions}</select></div>
    <div class="mb-3"><label class="form-label">Tanggal</label>
      <input type="date" class="form-control" name="date" required></div>
    <div class="mb-3"><label class="form-label">Keterangan</label>
      <textarea class="form-control" name="description" required></textarea></div>
    <div class="mb-3"><label class="form-label">Poin</label>
      <input type="number" class="form-control" name="point" value="5"></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/bk/violations" class="btn btn-link">Batal</a>
  </form>`;
  return renderLayout({ title: 'Catat Pelanggaran', user: req.user, body, flash: popFlash(req) });
}

function achievementsListPage(req, achievements, canCreate) {
  const rows = achievements
    .map((a) => `<tr><td>${esc(a.date)}</td><td>${esc(a.student_name)} (${esc(a.nis)})</td><td>${esc(a.description)}</td><td>${esc(a.level)}</td></tr>`)
    .join('');
  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Prestasi Siswa</h2>
    ${canCreate ? `<a href="/bk/achievements/create" class="btn btn-primary">+ Catat Prestasi</a>` : ''}
  </div>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link" href="/bk">Rekap Kasus</a></li>
    <li class="nav-item"><a class="nav-link" href="/bk/violations">Pelanggaran</a></li>
    <li class="nav-item"><a class="nav-link active" href="/bk/achievements">Prestasi</a></li>
  </ul>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Tanggal</th><th>Siswa</th><th>Keterangan</th><th>Tingkat</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="text-center text-muted">Belum ada data</td></tr>'}</tbody>
  </table>`;
  return renderLayout({ title: 'Prestasi Siswa', user: req.user, body, flash: popFlash(req) });
}

function achievementFormPage(req, { students }) {
  const studentOptions = students.map((s) => `<option value="${s.id}">${esc(s.name)} - ${esc(s.nis)}</option>`).join('');
  const body = `
  <h2>Catat Prestasi</h2>
  <form method="POST" action="/bk/achievements/create" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3"><label class="form-label">Siswa</label>
      <select class="form-select" name="student_id" required>${studentOptions}</select></div>
    <div class="mb-3"><label class="form-label">Tanggal</label>
      <input type="date" class="form-control" name="date" required></div>
    <div class="mb-3"><label class="form-label">Keterangan</label>
      <textarea class="form-control" name="description" required></textarea></div>
    <div class="mb-3"><label class="form-label">Tingkat</label>
      <select class="form-select" name="level">
        <option>Sekolah</option><option>Kecamatan</option><option>Kabupaten</option><option>Provinsi</option><option>Nasional</option>
      </select></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/bk/achievements" class="btn btn-link">Batal</a>
  </form>`;
  return renderLayout({ title: 'Catat Prestasi', user: req.user, body, flash: popFlash(req) });
}

module.exports = {
  bkIndexPage,
  bkFormPage,
  bkDetailPage,
  violationsListPage,
  violationFormPage,
  achievementsListPage,
  achievementFormPage,
};
