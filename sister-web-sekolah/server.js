/**
 * server.js
 * Entry point aplikasi SISTER (Sistem Informasi Sekolah Terintegrasi).
 *
 * Arsitektur: Modular Monolith.
 * Setiap "modul" (Manajemen Pengguna, Data Kesiswaan, Jurnal Mengajar, BK)
 * dipisah menjadi file route + view tersendiri di folder routes/ dan views/,
 * tetapi berjalan dalam satu proses Node.js dan berbagi SATU DATABASE UTAMA
 * (db/school.db) sebagai pusat penyimpanan data.
 *
 * Kenapa modular monolith (bukan microservices penuh) untuk MID ini?
 * - Lebih cepat dikembangkan & di-deploy untuk skala tim kecil (4-5 orang, waktu terbatas).
 * - Batas antar modul tetap jelas (folder terpisah) sehingga MUDAH dipecah
 *   menjadi service terpisah di kemudian hari jika beban salah satu modul
 *   (mis. Jurnal Mengajar) jauh lebih tinggi daripada modul lain.
 * - Lihat README.md bagian "Strategi Scalability" untuk rencana pemisahan
 *   menjadi service-based / microservices ketika beban meningkat.
 */

const path = require('path');
const { createApp } = require('./lib/miniweb');

const db = require('./db'); // inisialisasi koneksi + skema database utama
require('./db/seed'); // isi data dummy jika database masih kosong

const app = createApp();
app.static_(path.join(__dirname, 'public'));

// Registrasi route per modul (pemisahan modular ala service-based design)
require('./routes/auth')(app);
require('./routes/dashboard')(app);
require('./routes/users')(app);
require('./routes/students')(app);
require('./routes/journal')(app);
require('./routes/bk')(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('==========================================================');
  console.log(' SISTER - Sistem Informasi Sekolah Terintegrasi');
  console.log(' Server berjalan di: http://localhost:' + PORT);
  console.log(' Database: ' + db.DB_FILE);
  console.log('==========================================================');
});
