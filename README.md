# MID-SSD-Web-Sekolah-Kelompok-3

## 1. Judul Proyek
Web Sekolah Berbasis Web

---

## 2. Deskripsi Singkat Sistem

Web Sekolah merupakan aplikasi berbasis web yang digunakan untuk membantu pengelolaan administrasi sekolah secara digital. Sistem ini menyediakan beberapa modul utama seperti autentikasi pengguna, dashboard, data siswa, jurnal mengajar, bimbingan konseling (BK), dan manajemen pengguna.

---

## 3. Nama Anggota Kelompok

1. Ridha Awalia Adi : 105841110123
2. Asmaul Husna : 105841110323
3. Arina Manasikana : 105841108623
4. Neneng Anjarwati : 105841109423
5. Risa l : 105841111023

---

## 4. Pembagian Tugas

| Nama | Tugas |
|-------|--------|
| Ridha Awalia Adi | Backend, Database, GitHub |
| Asmaul Husna | Frontend |
| Arina Manasikana | Dashboard |
| Neneng Anjarwati | Dokumentasi |
| Risal | Testing & Presentasi |

---

## 5. Daftar Modul

* Login
* Dashboard
* Data Siswa
* Jurnal Mengajar
* Bimbingan Konseling (BK)
* Manajemen User

---

## 6. Teknologi yang Digunakan

* Node.js
* Express.js
* SQLite
* HTML
* CSS
* JavaScript
* Git
* GitHub

---

## 7. Struktur Folder

```
sister-web-sekolah
│
├── db
│   ├── index.js
│   ├── schema.sql
│   └── seed.js
│
├── routes
├── views
├── public
├── lib
├── server.js
├── package.json
└── README.md
```

---

## 8. Rancangan Arsitektur Sistem

```
Browser
    │
    ▼
Node.js + Express
    │
    ▼
SQLite Database
```

---

## 9. Rancangan Database

Database terdiri dari beberapa tabel seperti:

* users
* students
* journals
* counseling

Relasi utama:

User → Login

Student → Journal

Student → BK

---

## 10. Cara Instalasi

Clone repository

```
git clone https://github.com/RIDHAAWALIAADI/MID-SSD-Web-Sekolah-Kelompok-3.git
```

Masuk ke folder

```
cd sister-web-sekolah
```

Install dependency

```
npm install
```

---

## 11. Cara Menjalankan

```
npm start
```

atau

```
node server.js
```

Buka browser

```
http://localhost:3000
```

---

## 12. Akun Login Demo

Administrator

Username :
admin

Password :
admin123

(Sesuaikan dengan data pada database.)

---

## 13. Link Video Presentasi

https://youtu.be/ISI_LINK_VIDEO

---

## 14. Penjelasan Unsur Scalable System Design

Pada proyek ini diterapkan beberapa konsep Scalable System Design, yaitu:

* Pemisahan folder berdasarkan fungsi (Routes, Views, Database).
* Menggunakan Express.js sebagai backend.
* Database dipisahkan dari logika aplikasi.
* Setiap fitur dibuat dalam file route yang berbeda sehingga mudah dikembangkan.
* Struktur modular memudahkan penambahan fitur baru tanpa mengubah keseluruhan sistem.
* Git dan GitHub digunakan sebagai Version Control untuk kolaborasi tim.

---

## Repository

https://github.com/RIDHAAWALIAADI/MID-SSD-Web-Sekolah-Kelompok-3# MID-SSD-Web-Sekolah-Kelompok-3
Proyek Web Sekolah untuk mata kuliah Scalable System Design.
