# ROADMAP PENGEMBANGAN: SIM PASTI v3.0 (Enterprise Edition)

**Tumpukan Teknologi (Tech Stack):**
*   **Framework (Frontend & Backend):** Next.js (React) + Node.js
*   **Bahasa Pemrograman:** TypeScript (Sangat disarankan untuk skala Enterprise)
*   **Database:** PostgreSQL dengan ekstensi PostGIS (Spasial)
*   **ORM (Database Driver):** Prisma ORM
*   **Engine Peta:** MapLibre GL JS / React-Leaflet
*   **Styling UI:** Tailwind CSS + Shadcn UI (Tampilan elegan & modern)

---

## FASE 1: Inisiasi & Konfigurasi Dasar (Project Setup)
*Target: Lingkungan pengembangan lokal siap digunakan.*

- [x] Inisialisasi proyek Next.js terbaru (`npx create-next-app@latest`).
- [x] Konfigurasi Tailwind CSS untuk desain UI.
- [x] Setup *Version Control* (Git) & membuat file `.gitignore`.
- [x] Instalasi dan koneksi ke database PostgreSQL lokal.
- [x] Instalasi **Prisma ORM** untuk menjembatani Next.js dengan PostgreSQL.
- [x] Mengaktifkan ekstensi **PostGIS** di dalam PostgreSQL.

## FASE 2: Struktur Database & Skema (Data Modeling)
*Target: Semua tabel dari dokumen Excel berhasil dipetakan ke dalam sistem.*

- [x] Membedah file `Database PASTI ... .xlsx`.
- [x] Menerjemahkan tabel-tabel tersebut ke dalam file `schema.prisma`.
- [x] Membuat tipe data khusus spasial (Geometry/Polygon) untuk aset tanah.
- [x] Menjalankan *Migration* pertama untuk membuat tabel di PostgreSQL.
- [x] Membuat *Seeder* (Data palsu awal) untuk keperluan testing (Akun Super Admin, dll).

## FASE 3: Autentikasi & Kerangka Dashboard
*Target: Sistem memiliki gerbang masuk yang aman dan antarmuka utama.*

- [x] Instalasi dan setup **NextAuth.js (Auth.js)** untuk manajemen Login.
- [x] Membuat fitur *Role-Based Access Control* (RBAC) - pemisahan hak akses antara Super Admin, Manajer, dan Operator.
- [x] Membangun tata letak (*Layout*) Dashboard Enterprise: Sidebar, Header, dan sistem Navigasi.
- [x] Mengamankan *Route* (Halaman hanya bisa diakses jika sudah login).

## FASE 4: Modul Inti Pemetaan (WebGIS Core)
*Target: Peta satelit muncul di web dan bisa berinteraksi.*

- [x] Mengintegrasikan library Peta (MapLibre / Leaflet) ke dalam komponen React/Next.js.
- [x] Menyiapkan *Basemap* (Citra Satelit dari Esri atau OSM).
- [x] Membangun fitur *Draw Polygon* (Operator bisa menitik batas tanah di peta).
- [x] Membuat API Endpoint untuk menerima data *Polygon* dan menyimpannya ke kolom Geometry di PostGIS.
- [x] Menampilkan kembali (Render) semua poligon aset yang ada di database ke atas peta utama.

## FASE 5: Manajemen Aset, Dokumen & Risiko
*Target: Fungsi bisnis utama berjalan menyeluruh (CRUD, Dokumen, & Risk Matrix).*

- [x] Halaman Daftar Aset (Tabel dengan fitur Filter, Pencarian, & Pagination).
- [x] Halaman Detail Aset (Menampilkan metadata lengkap, riwayat, dan letak di peta spasial).
- [x] Modul Unggah Dokumen (Upload PDF Sertifikat, Foto Fisik Aset Lapangan).
- [x] In-Memory Canvas PDF Viewer (Bebas auto-download IDM) & Halaman Dedicated Viewer Tab.
- [x] Modul Risk Register (Matriks 5x5 Permendagri 19/2016, Estimasi Biaya APBD/TAPD, & Sebaran Titik Risiko).
- [x] Halaman *Dashboard Analytics* (Executive BI Donut Charts Komposisi Legalitas & Hak, Bar Chart Risiko).
- [x] Peta Spasial Beresolusi Tinggi (Google Hybrid HD Satellite, auto-upscaling Esri, & Basemap Switcher Control).

## FASE 6: Optimasi, Keamanan & Deployment
*Target: Aplikasi siap dirilis dan digunakan publik/internal secara aman dan andal.*

- [x] Fitur Ekspor Data & Pelaporan (Ekspor CSV Master Tanah & Risk Register dengan UTF-8 BOM).
- [x] Fitur Cetak Lembar Profil Aset Resmi bertata letak kop surat Pemkab Aceh Tengah.
- [x] Penyelarasan Database & Otomasi Risk Scoring (Berdasarkan Prototype Database PASTI.xlsx):
  - [x] Penambahan atribut fisik & penguasaan tanah pada model Tanah: Batas Bidang, Papan Aset, Pagar Pengamanan, Status Penguasaan, Pemanfaatan, & Permasalahan Lapangan.
  - [x] Penambahan form input `Asset ID` dan `Kode Tanah` sebelum nama aset di form penambahan, edit, dan detail aset.
  - [x] Algoritma Otomasi Skoring 6 Dimensi Risiko (Administrasi, Legal, Fisik, Penguasaan, Sengketa, Strategis) berbasis pembobotan parameter fisik (skala nilai 0 - 2).
  - [x] Integrasi Total Skor Risiko Otomatis sebagai tolak ukur agregat pada grafik Dashboard Eksekutif (Chart Balok Berdiri Kompak) & Risk Matrix.
  - [x] Penyempurnaan atribut audit formal Risk Register: Penyebab (Root Cause), Dampak Kualitatif, Pengendalian Yang Ada (Existing Control), & Status Tindak Lanjut (Selesai/Proses/Belum).
- [x] Fitur Spasial Terintegrasi & Pewarnaan Poligon Berbasis Indikator Sertifikat:
  - [x] Integrasi Luas Tanah Geodesik Otomatis dua arah terhubung dengan batas koordinat poligon PostGIS (WGS84 Spherical Excess).
  - [x] Pewarnaan Poligon Peta Spasial Berbasis Indikator Sertifikat (🟢 Hijau: Bersertifikat, 🟡/🟠 Kuning: Dalam Pengurusan, 🔴 Merah: Tidak Ada / Bermasalah).
  - [x] Sinkronisasi Warna Indikator Peta dengan Grafik Donat Komposisi Status Legalitas & Legenda Interaktif.
- [x] Penyempurnaan Tata Letak Eksekutif & Sidebar Responsif:
  - [x] Panel menu samping (*Collapsible Sidebar*) fleksibel dengan 1 tombol geser tepi, mode logo-saja (*logo-only view*) saat diperkecil.
  - [x] Pembersihan header atas dan penaikan Banner Sambutan Eksekutif full-width terintegrasi indikator spasial.
- [x] *Security Audit*: Memastikan validasi skema input, proteksi upload file, dan keamanan rute API:
  - [x] Autentikasi Sesi (`getServerSession`) & Hak Akses Berbasis Peran (RBAC) di seluruh Endpoint API (`/api/upload`, `/api/docs/stream`, `/api/assets/tanah`, `/api/risk`, `/api/export/*`).
  - [x] Proteksi File Upload Menyeluruh: Whitelist ekstensi aman (.pdf, .jpg, .jpeg, .png, .webp), validasi MIME Type, batas ukuran 15 MB, & penamaan acak kriptografis UUID anti-penimpaan file.
  - [x] Proteksi SSRF (Server-Side Request Forgery) & Directory Traversal pada streaming dokumen in-memory.
  - [x] Konfigurasi HTTP Security Headers Enterprise (`HSTS`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- [x] Validasi Produksi Build (`npm run build`) untuk memastikan 0 lint/type issues:
  - [x] Kompilasi bundel produksi Turbopack/Next.js 16 sukses (0 errors, 0 type issues, 19/19 routes compiled).
- [ ] *Deployment* aplikasi ke VPS Cloud (Ubuntu, Nginx, PM2) / Kontainerisasi Docker.
- [ ] *Setup Domain* & Sertifikat Keamanan (HTTPS/SSL).

---
*Roadmap ini adalah acuan tunggal progres pengembangan SIM PASTI v3.0.*
