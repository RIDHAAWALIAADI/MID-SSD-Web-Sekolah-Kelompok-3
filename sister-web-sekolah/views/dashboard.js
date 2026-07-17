const { renderLayout, popFlash, esc } = require('./layout');

function statCard(label, value, color, icon) {
  return `
  <div class="col-lg-3 col-md-6 mb-4">
      <div class="dashboard-card ${color}">
          <div class="card-icon">
              <i class="bi ${icon}"></i>
          </div>

          <div class="card-content">
              <h2>${esc(value)}</h2>
              <span>${esc(label)}</span>
          </div>
      </div>
  </div>
  `;
}

function dashboardPage(req, stats) {
  const user = req.user;

  let cards = '';
  let extra = '';

  if (user.role_name === 'admin') {

    cards =
      statCard('Total Pengguna', stats.userCount, 'blue', 'bi-people-fill') +
      statCard('Total Siswa', stats.studentCount, 'green', 'bi-mortarboard-fill') +
      statCard('Total Kelas', stats.classCount, 'cyan', 'bi-building') +
      statCard('Jurnal Bulan Ini', stats.journalCount, 'orange', 'bi-journal-bookmark-fill');

    extra = `
    <div class="welcome-box">
        <h5>👋 Selamat Datang Admin</h5>
        <p>
            Anda memiliki akses penuh ke seluruh sistem.
            Kelola pengguna, siswa, kelas, jurnal mengajar,
            serta data BK melalui menu navigasi di atas.
        </p>
    </div>`;
  }

  else if (user.role_name === 'guru') {

    cards =
      statCard('Jurnal Saya', stats.myJournalCount, 'blue', 'bi-journal-text');

    extra = `
    <div class="welcome-box">
        Gunakan menu <b>Jurnal Mengajar</b> untuk mencatat aktivitas pembelajaran setiap hari.
    </div>`;
  }

  else if (user.role_name === 'guru_bk') {

    cards =
      statCard('Kasus Aktif', stats.activeCases, 'red', 'bi-exclamation-circle-fill') +
      statCard('Total Kasus', stats.totalCases, 'blue', 'bi-folder-fill');

    extra = `
    <div class="welcome-box">
        Semua data BK bersifat rahasia dan hanya dapat diakses oleh Guru BK.
    </div>`;
  }

  else if (user.role_name === 'wali_kelas') {

    cards =
      statCard('Siswa Kelas', stats.classStudentCount, 'green', 'bi-person-lines-fill');

    extra = `
    <div class="welcome-box">
        Pantau seluruh siswa dan perkembangan kelas yang Anda ampu.
    </div>`;
  }

  else if (user.role_name === 'kepala_sekolah') {

    cards =
      statCard('Total Siswa', stats.studentCount, 'green', 'bi-mortarboard-fill') +
      statCard('Total Guru', stats.teacherCount, 'blue', 'bi-person-workspace') +
      statCard('Jurnal', stats.journalCount, 'orange', 'bi-journal-bookmark-fill') +
      statCard('Kasus BK', stats.bkThisMonth, 'red', 'bi-clipboard2-pulse-fill');

    extra = `
    <div class="welcome-box">
        Dashboard ini menampilkan laporan seluruh aktivitas sekolah.
    </div>`;
  }

  else if (user.role_name === 'siswa') {

    extra = `
    <div class="welcome-box">
        Selamat datang <b>${esc(user.name)}</b>.
    </div>`;
  }

  else if (user.role_name === 'orang_tua') {

    extra = `
    <div class="welcome-box">
        Portal Orang Tua digunakan untuk memantau perkembangan anak.
    </div>`;
  }

  const body = `

<div class="dashboard-header">
    <h2>Dashboard</h2>
    <p>Selamat datang kembali,
    <strong>${esc(user.name)}</strong></p>
</div>

<div class="row">

${cards}

</div>

${extra}

`;

  return renderLayout({
    title: 'Dashboard',
    user,
    body,
    flash: popFlash(req)
  });
}

module.exports = { dashboardPage };