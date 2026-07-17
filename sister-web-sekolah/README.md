# SISTER — Sistem Informasi Sekolah Terintegrasi Berbasis Web

Proyek UJIAN MID Semester — Mata Kuliah **Scalable System Design**.

Judul lengkap: **Perancangan dan Pengembangan SISTER (Sistem Informasi Sekolah
Terintegrasi) Berbasis Web dengan Prinsip Scalable System Design**.

Web sekolah terintegrasi yang menggabungkan 4 modul utama (Manajemen Pengguna,
Data Kesiswaan, Jurnal Mengajar, dan Bimbingan Konseling/BK) dalam satu aplikasi
yang berbagi **satu database utama**, dilengkapi Role-Based Access Control (RBAC)
dan rancangan strategi skalabilitas.

---

## 1. Daftar Isi

1. Ringkasan Modul
2. Teknologi yang Dipakai (dan Kenapa)
3. Struktur Folder Proyek
4. Cara Instalasi & Menjalankan
5. Akun Demo
6. Rancangan Database (ERD ringkas)
7. Hak Akses Pengguna (RBAC)
8. Arsitektur Sistem & Pembagian vCPU
9. Unsur Scalable System Design yang Diterapkan
10. Risiko Sistem & Solusi
11. Batasan & Pengembangan Selanjutnya

---

## 2. Ringkasan Modul

| Modul | Fitur Utama | Role yang Terlibat |
|---|---|---|
| **Manajemen Pengguna** | Login/logout, CRUD user & role, aktivasi/nonaktivasi akun, audit log aktivitas | Admin (kelola penuh) |
| **Data Kesiswaan** | CRUD data siswa, kelola kelas & wali kelas, status siswa, export CSV | Admin (kelola), Guru BK/Wali Kelas/Kepsek (lihat) |
| **Jurnal Mengajar** | Input jurnal harian (kelas, mapel, tanggal, materi, metode, catatan), riwayat & rekap | Guru (kelola milik sendiri), Wali Kelas/Kepsek/Admin (rekap) |
| **BK (Bimbingan Konseling)** | Catat kasus (konseling/pelanggaran/prestasi), catatan tindak lanjut, riwayat per siswa | Guru BK (kelola penuh), Wali Kelas/Kepsek/Admin (rekap, read-only) |

Seluruh modul berbagi tabel inti yang sama: `users`, `students`, `teachers`,
`classes`, `subjects`, `academic_years` — sesuai ketentuan proyek bahwa data
siswa/guru/kelas/mapel harus dipakai bersama oleh semua modul tanpa duplikasi input.

---

## 3. Teknologi yang Dipakai (dan Kenapa)

| Layer | Teknologi | Alasan |
|---|---|---|
| Runtime & HTTP server | **Node.js core (`http`) + micro-router buatan sendiri** (`lib/miniweb.js`) | Supaya proyek bisa langsung `node server.js` tanpa proses `npm install` apa pun (nol dependency eksternal) — menghindari kegagalan instalasi di laptop anggota kelompok yang berbeda-beda. API-nya didesain mirip Express (`app.get/app.post`, `req/res`) supaya mudah dipahami dan mudah dimigrasikan ke Express jika proyek dikembangkan lebih lanjut. |
| Database | **SQLite** via modul bawaan Node.js `node:sqlite` (stabil sejak Node 22.5+) | Database relasional sungguhan (bukan sekadar file JSON), mendukung SQL penuh (JOIN, index, foreign key) tanpa perlu instalasi server database terpisah (MySQL/PostgreSQL) — cocok untuk demo lokal. Untuk produksi, tinggal ganti ke MySQL/PostgreSQL (lihat bagian 9). |
| Frontend | **Bootstrap 5 (CDN) + HTML digenerate dari JS (server-side rendering)** | Tanpa build step, tanpa dependency, tampilan tetap rapi. |
| Autentikasi | **Session cookie in-memory + `crypto.scrypt`** untuk hashing password | Bawaan Node.js, aman (scrypt tahan brute-force), tidak butuh package eksternal seperti bcrypt. |

> **Catatan penting:** Karena tidak memakai `npm install`, proyek ini membutuhkan
> **Node.js versi 22.5 atau lebih baru** (modul `node:sqlite` bersifat
> experimental tapi stabil digunakan). Cek versi dengan `node -v`.
> Jika kelompok ingin memakai Express/EJS/MySQL sungguhan untuk pengembangan
> lanjutan (di luar MID), struktur folder modular pada proyek ini sudah
> dirancang agar mudah dimigrasikan.

---

## 4. Struktur Folder Proyek

```
sister-web-sekolah/
├── server.js              # entry point aplikasi
├── package.json
├── lib/
│   ├── miniweb.js          # micro web-framework (routing, middleware, session)
│   └── auth.js             # hashing password, requireAuth & requireRole (RBAC)
├── db/
│   ├── schema.sql          # DDL seluruh tabel + index (database utama)
│   ├── index.js            # koneksi SQLite + helper query (get/all/run)
│   ├── seed.js             # data dummy (akun demo, siswa, guru, dsb.)
│   └── school.db           # file database (otomatis dibuat saat pertama run)
├── routes/                 # 1 file = 1 modul (pemisahan tanggung jawab)
│   ├── auth.js
│   ├── dashboard.js
│   ├── users.js            # modul Manajemen Pengguna
│   ├── students.js         # modul Data Kesiswaan (+ kelas)
│   ├── journal.js          # modul Jurnal Mengajar
│   └── bk.js                # modul BK
├── views/                  # render HTML per modul (server-side rendering)
└── public/
    └── style.css
```

---

## 5. Cara Instalasi & Menjalankan

**Prasyarat:** Node.js **v22.5+** ([nodejs.org](https://nodejs.org)) — tidak butuh
software lain (tidak perlu instal MySQL/XAMPP/dsb).

```bash
# 1. Masuk ke folder proyek
cd sister-web-sekolah

# 2. Jalankan aplikasi (tanpa npm install!)
node server.js

# 3. Buka browser
http://localhost:3000
```

Saat pertama kali dijalankan, aplikasi otomatis membuat `db/school.db`, menerapkan
skema, dan mengisi data dummy (akun demo + beberapa siswa/guru contoh). Untuk
mengulang dari nol, hapus file `db/school.db` lalu jalankan ulang.

Untuk mengganti port: `PORT=8080 node server.js`.

---

## 6. Akun Demo

Semua akun demo memakai password yang sama: **`password123`**
(data fiktif, aman diunggah ke GitHub — lihat bagian Keamanan).

| Role | Email |
|---|---|
| Admin | admin@sekolah.test |
| Guru | guru@sekolah.test |
| Guru BK | bk@sekolah.test |
| Wali Kelas | walikelas@sekolah.test |
| Kepala Sekolah | kepsek@sekolah.test |
| Siswa | siswa@sekolah.test |
| Orang Tua | ortu@sekolah.test |

---

## 7. Rancangan Database (ERD Ringkas)

Satu database utama (`db/school.db`) dipakai bersama oleh semua modul.

```
roles ─┬─< users >─┬─ teachers ─┬─< classes >── academic_years ─< semesters
       │           │            │        │
       │           └─ students ─┘        └─< teaching_journals >─ subjects
       │
       └── activity_logs (audit log semua user)

students ─┬─< bk_cases
          ├─< bk_counseling_notes
          ├─< student_violations
          └─< student_achievements
```

Relasi kunci:
- `users.role_id → roles.id` — dasar RBAC.
- `users.teacher_id` / `users.student_id` — menghubungkan akun login ke identitas guru/siswa.
- `students.class_id → classes.id`, `classes.wali_kelas_teacher_id → teachers.id`.
- `teaching_journals` terhubung ke `teachers`, `classes`, `subjects` sekaligus (jurnal = guru mengajar mapel apa di kelas mana).
- `bk_cases`, `bk_counseling_notes`, `student_violations`, `student_achievements` semuanya mereferensikan `students.id` — sehingga riwayat lengkap seorang siswa dapat direkap dari satu `student_id`.

Optimasi database yang diterapkan (lihat `db/schema.sql`):
- Index pada `class_id`, `teacher_id`, `student_id` di tabel-tabel transaksional (jurnal, BK, pelanggaran, prestasi) — mempercepat query rekap per siswa/kelas.
- Index unik pada `email` (users) dan `nis` (students) — mencegah data ganda sekaligus mempercepat pencarian login/siswa.
- Foreign key diaktifkan (`PRAGMA foreign_keys = ON`) untuk menjaga konsistensi data lintas modul.

---

## 8. Hak Akses Pengguna (RBAC)

Implementasi ada di `lib/auth.js` (`requireRole(...roles)` middleware) dan diterapkan di setiap route:

| Role | Manajemen Pengguna | Data Kesiswaan | Jurnal Mengajar | BK |
|---|---|---|---|---|
| Admin | Kelola penuh | Kelola penuh | Lihat semua | Lihat semua (rekap) |
| Guru | – | – | Kelola milik sendiri | – |
| Guru BK | – | Lihat semua | – | Kelola penuh |
| Wali Kelas | – | Lihat kelas sendiri saja | Lihat kelas sendiri | Lihat kelas sendiri (rekap) |
| Kepala Sekolah | – | Lihat semua (read-only) | Lihat semua (rekap) | Lihat semua (rekap) |
| Siswa | – | Profil sendiri | – | – |
| Orang Tua | – | Profil anak | – | – |

Setiap request yang mengubah data (login, CRUD, catat kasus BK) dicatat ke tabel
`activity_logs` (lihat menu **Log Aktivitas**, khusus Admin) sebagai audit trail —
memenuhi unsur *monitoring & logging* dari Scalable System Design.

---

## 9. Arsitektur Sistem & Pembagian vCPU

**Untuk demo MID**, aplikasi berjalan sebagai **modular monolith**: satu proses
Node.js, tapi kode dipisah rapi per modul (folder `routes/` & `views/`) sehingga
mudah dipecah lebih lanjut. Ini pilihan sadar karena tim kecil (4–5 orang) dan
waktu terbatas — microservices penuh akan menambah kompleksitas deployment yang
tidak sepadan untuk skala proyek MID.

**Rencana pembagian vCPU / server virtual saat sistem perlu di-scale:**

| vCPU | Layanan | Alasan Teknis |
|---|---|---|
| vCPU 1 | Web Jurnal Mengajar | Diakses setiap hari oleh semua guru (traffic tertinggi) → dipisah agar tidak mengganggu modul lain saat jam sibuk (pagi hari). |
| vCPU 2 | Web BK | Berisi data sensitif (kasus siswa) → dipisah untuk isolasi keamanan & kontrol akses lebih ketat. |
| vCPU 3 | Web Data Kesiswaan & Manajemen Pengguna | Frekuensi akses lebih rendah, dapat digabung dalam satu node. |
| vCPU 4 | Database Server (MySQL/PostgreSQL terkelola) | Dipisah dari layer aplikasi agar performa I/O stabil dan bisa di-scale vertikal independen. |
| vCPU 5 | Load Balancer + Monitoring + Logging (Nginx/HAProxy + Prometheus/Grafana) | Titik masuk tunggal untuk membagi request & memantau kesehatan seluruh layanan. |

Diagram alur (skema):

```
                 ┌────────────────┐
 User ───────────▶ Load Balancer  │
                 └───────┬────────┘
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
 [vCPU1] Jurnal   [vCPU2] BK        [vCPU3] Kesiswaan
   Mengajar                          + Manajemen Pengguna
        └────────────────┴─────────────────┘
                          ▼
                 [vCPU4] Database Server
                  (MySQL/PostgreSQL)
                          ▲
                 [vCPU5] Monitoring & Logging
```

---

## 10. Unsur Scalable System Design yang Diterapkan

1. **Modular Architecture** — kode dipisah per modul (`routes/users.js`,
   `routes/students.js`, `routes/journal.js`, `routes/bk.js`), masing-masing
   punya tanggung jawab jelas dan bisa dikembangkan/dipindah independen.
2. **Centralized Database** — satu file `db/school.db` dipakai semua modul;
   data siswa/guru/kelas cukup diinput sekali (lihat bagian 7).
3. **Role-Based Access Control** — middleware `requireAuth` & `requireRole`
   membatasi akses tiap endpoint berdasarkan role (bagian 8).
4. **Database Optimization** — indexing pada kolom FK yang sering di-query,
   constraint unik untuk mencegah duplikasi (bagian 7).
5. **Monitoring & Logging** — tabel `activity_logs` mencatat semua aksi penting
   (login, create/update/delete) beserta pelakunya dan waktunya.
6. **Horizontal & Vertical Scaling (rencana)** — dijelaskan di bagian 9: modul
   dengan beban tinggi (Jurnal Mengajar) bisa digandakan (horizontal scaling
   dengan load balancer), sementara Database Server ditingkatkan spesifikasi
   CPU/RAM-nya saat data membesar (vertical scaling).
7. **API-Based Integration (arah pengembangan)** — saat ini modul berkomunikasi
   lewat pemanggilan fungsi langsung ke `db/index.js` dalam satu proses; jika
   dipecah jadi service terpisah, helper `get/all/run` di `db/index.js`
   tinggal diganti pemanggilan REST/gRPC API tanpa mengubah logika di
   `routes/*.js` (abstraksi data sudah dipisah dari logika bisnis).
8. **Caching (arah pengembangan)** — data yang jarang berubah (daftar kelas,
   daftar mapel, daftar guru) adalah kandidat utama untuk di-cache (mis. Redis)
   agar tidak selalu query ke database saat sistem sudah besar.

---

## 11. Risiko Sistem & Solusi

| Risiko | Solusi |
|---|---|
| Database terpusat jadi bottleneck saat semua modul membaca/menulis bersamaan | Pisahkan database server ke vCPU sendiri (bagian 9), tambahkan read-replica untuk query laporan (mis. Kepala Sekolah), gunakan caching untuk data yang jarang berubah. |
| Modul Jurnal Mengajar overload saat jam masuk sekolah (semua guru login bersamaan) | Horizontal scaling: tambah instance layanan Jurnal Mengajar + load balancer. |
| Data BK bocor ke pihak yang tidak berwenang | RBAC ketat (`requireRole('guru_bk', ...)`), audit log setiap akses/perubahan data BK. |
| Kehilangan akses jika satu server mati (single point of failure) | Rencana multi-instance di belakang load balancer + backup database berkala. |
| Session hilang saat server di-restart (sesi disimpan in-memory) | Untuk produksi/multi-server, pindahkan session store ke Redis agar tidak terikat satu proses. |

---

## 12. Batasan & Pengembangan Selanjutnya

Untuk memenuhi tenggat MID, cakupan proyek ini difokuskan pada **4 modul wajib**
(Manajemen Pengguna, Data Kesiswaan, Jurnal Mengajar, BK) dengan RBAC untuk
7 role. Pengembangan lanjutan yang disarankan:

- Modul **Akademik** (nilai, rapor, jadwal pelajaran) — struktur tabel `subjects`,
  `semesters`, `academic_years` sudah disiapkan agar mudah ditambahkan.
- Import data siswa dari CSV (saat ini baru tersedia **export** CSV di menu Data Kesiswaan).
- Migrasi database dari SQLite ke MySQL/PostgreSQL untuk deployment produksi multi-server.
- Autentikasi berbasis JWT/API token jika modul dipecah menjadi service terpisah.
- Deployment ke server/cloud (opsional untuk MID, jadi nilai tambah).

---

## Keamanan

- Password di-hash dengan `crypto.scrypt` (bukan plain text) — lihat `lib/auth.js`.
- Tidak ada kredensial asli, token API, atau data siswa asli dalam proyek ini — seluruhnya data dummy/fiktif.
- File `db/school.db` (hasil runtime) sudah dimasukkan ke `.gitignore` agar tidak ikut ter-commit ke repository.
