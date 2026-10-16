# ATURAN PROYEK — SoleMate (Marketplace Sepatu)

Marketplace sepatu yang berjalan di localhost untuk tugas kuliah Pemrograman Web.
Bahasa UI: **Bahasa Indonesia**. Bahasa kode/identifier: **Inggris**.

## Stack

- Next.js 15 (App Router) + TypeScript **strict**
- Tailwind CSS untuk styling
- Prisma + PostgreSQL (database)
- Zod untuk validasi input
- `jose` untuk JWT
- bcryptjs untuk hash password
- midtrans-client untuk pembayaran
- lucide-react untuk ikon, `clsx` untuk class util

## Struktur Folder

- `src/app` — halaman & route handler (App Router)
- `src/components` — komponen UI
- `src/lib` — utilitas server/shared:
  - `prisma.ts` — Prisma client
  - `auth.ts` — JWT, session, helper auth
  - `midtrans.ts` — integrasi Midtrans
  - `format.ts` — `formatRupiah()` dll.
  - `validators.ts` — skema Zod
- `prisma/` — `schema.prisma`, `seed.ts`

## Aturan Wajib

1. **Prisma client singleton** di `src/lib/prisma.ts`. Jangan membuat instance Prisma baru di tempat lain.
2. **Harga** disimpan sebagai `Int` dalam Rupiah (tanpa desimal). Format tampilan `"Rp 1.250.000"` hanya lewat `formatRupiah()`.
3. **Midtrans Server Key DILARANG** muncul di kode client atau prefix `NEXT_PUBLIC_`. Server Key hanya dipakai di server (`src/lib/midtrans.ts`).
4. **Harga, total, dan stok SELALU dihitung ulang di server dari database.** Jangan pernah percaya angka (harga, total, kuantitas) yang dikirim client.
5. **Semua input** route handler/server action divalidasi dengan **Zod**. Error dikembalikan sebagai JSON `{ error: string }` dengan status HTTP yang benar.
6. **Autentikasi**: JWT disimpan di cookie `httpOnly` (`sameSite=lax`). Role: `CUSTOMER` dan `ADMIN`. Proteksi halaman lewat `src/middleware.ts` **dan** cek ulang di setiap route handler (defense in depth).
7. **Jangan menambahkan library/infrastruktur** di luar daftar tanpa izin. Tidak ada Redis, RabbitMQ, Docker, GraphQL.

## Alur Kerja

- Setiap selesai satu tahap: jalankan `npm run build` **dan** `npx tsc --noEmit`, perbaiki semua error, lalu laporkan ringkas apa yang dibuat dan cara mengujinya.
- Jangan menghapus atau menimpa file di luar lingkup tahap yang sedang dikerjakan.

## UI

- Bersih, modern, responsif (**mobile-first**).
- Sediakan **loading state**, **empty state**, dan **pesan error yang ramah**.
- Hindari tampilan template generik. Gunakan **satu warna aksen konsisten**.
