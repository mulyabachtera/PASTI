# Aturan Kerja Pengembangan SIM PASTI (Permanent Guidelines)

## 1. Alur Kerja Perubahan Kode & Deployment (SOP Wajib)
- **WAJIB TES DI LOCALHOST TERLEBIH DAHULU**:
  Setiap kali melakukan perubahan kode atau pembuatan fitur baru, sistem harus selalu dijalankan dan diuji di environment `localhost` terlebih dahulu sampai benar-benar berfungsi dengan baik dan bebas dari error.
- **DILARANG LANGSUNG PUSH KE GITHUB / DEPLOY KE VPS**:
  Jangan pernah melakukan `git push` atau deployment ke server VPS sebelum pengujian lokal selesai dan mendapat persetujuan.
- **WAJIB KONFIRMASI KE PENGGUNA SEBELUM PUSH/DEPLOY**:
  Setelah pengujian di localhost beres dan sempurna, **selalu tanyakan terlebih dahulu kepada pengguna**:
  > *"Apakah perubahan ini sudah sesuai dan siap untuk di-push ke GitHub serta diterapkan ke VPS?"*
  Hanya lakukan push dan deploy setelah pengguna memberikan instruksi/jawaban "Ya" atau "Push".

## 2. Kebijakan Akun Pengguna & Otentikasi
- Login sistem mendukung input **NIP** (Nomor Induk Pegawai 18 digit) atau **Email**.
- Setiap penambahan akun baru wajib memiliki **NIP** dan **Email**.
- Sistem memiliki mekanisme verifikasi email (status verifikasi dapat langsung disetujui / diverifikasi oleh Super Admin).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
