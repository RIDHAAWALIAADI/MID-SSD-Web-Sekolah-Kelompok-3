const { renderLayout, popFlash, esc } = require('./layout');

function journalListPage(req, journals, canCreate, canManage) {
  const rows = journals
    .map(
      (j) => `<tr>
        <td>${esc(j.date)}</td>
        <td>${esc(j.teacher_name)}</td>
        <td>${esc(j.class_name)}</td>
        <td>${esc(j.subject_name)}</td>
        <td>${esc(j.material)}</td>
        <td>${esc(j.method)}</td>
        <td>${esc(j.notes)}</td>
        ${canManage ? `<td class="text-nowrap">
          <a href="/journal/${j.id}/edit" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="POST" action="/journal/${j.id}/delete" class="d-inline" onsubmit="return confirm('Hapus jurnal ini?')">
            <button class="btn btn-sm btn-outline-danger">Hapus</button>
          </form>
        </td>` : ''}
      </tr>`
    )
    .join('');

  const body = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Jurnal Mengajar</h2>
    ${canCreate ? `<a href="/journal/create" class="btn btn-primary">+ Input Jurnal</a>` : ''}
  </div>
  <table class="table table-bordered bg-white">
    <thead><tr><th>Tanggal</th><th>Guru</th><th>Kelas</th><th>Mapel</th><th>Materi</th><th>Metode</th><th>Catatan</th>${canManage ? '<th>Aksi</th>' : ''}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${canManage ? 8 : 7}" class="text-center text-muted">Belum ada data</td></tr>`}</tbody>
  </table>`;

  return renderLayout({ title: 'Jurnal Mengajar', user: req.user, body, flash: popFlash(req) });
}

function journalFormPage(req, { classes, subjects, editJournal }) {
  const classOptions = classes
    .map((c) => `<option value="${c.id}" ${editJournal && editJournal.class_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`)
    .join('');
  const subjectOptions = subjects
    .map((s) => `<option value="${s.id}" ${editJournal && editJournal.subject_id === s.id ? 'selected' : ''}>${esc(s.name)}</option>`)
    .join('');

  const body = `
  <h2>${editJournal ? 'Edit' : 'Input'} Jurnal Mengajar</h2>
  <form method="POST" action="${editJournal ? '/journal/' + editJournal.id + '/update' : '/journal/create'}" class="card p-4 bg-white" style="max-width:600px">
    <div class="mb-3"><label class="form-label">Kelas</label>
      <select class="form-select" name="class_id" required>${classOptions}</select></div>
    <div class="mb-3"><label class="form-label">Mata Pelajaran</label>
      <select class="form-select" name="subject_id" required>${subjectOptions}</select></div>
    <div class="mb-3"><label class="form-label">Tanggal</label>
      <input type="date" class="form-control" name="date" required value="${editJournal ? esc(editJournal.date) : ''}"></div>
    <div class="mb-3"><label class="form-label">Materi Pembelajaran</label>
      <input class="form-control" name="material" required value="${editJournal ? esc(editJournal.material) : ''}"></div>
    <div class="mb-3"><label class="form-label">Metode Pembelajaran</label>
      <input class="form-control" name="method" value="${editJournal ? esc(editJournal.method) : ''}"></div>
    <div class="mb-3"><label class="form-label">Catatan</label>
      <textarea class="form-control" name="notes">${editJournal ? esc(editJournal.notes) : ''}</textarea></div>
    <button class="btn btn-primary">Simpan</button>
    <a href="/journal" class="btn btn-link">Batal</a>
  </form>`;

  return renderLayout({ title: 'Form Jurnal', user: req.user, body, flash: popFlash(req) });
}

module.exports = { journalListPage, journalFormPage };
