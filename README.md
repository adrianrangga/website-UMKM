# SoleMate — Marketplace Sepatu

Marketplace sepatu yang berjalan di localhost, dibuat untuk tugas kuliah
Pemrograman Web. Bahasa UI: Bahasa Indonesia.

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** + **PostgreSQL**
- **Zod** (validasi), **jose** (JWT), **bcryptjs** (hash password)
- **Midtrans Snap** (pembayaran, mode sandbox)

## Prasyarat

- Node.js 20+
- PostgreSQL berjalan di `localhost:5432`

## Setup

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu sesuaikan:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Koneksi PostgreSQL |
| `JWT_SECRET` | String acak minimal 32 karakter |
| `MIDTRANS_SERVER_KEY` | Server key sandbox (JANGAN dipakai di client) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key sandbox |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `false` untuk sandbox |
| `ENABLE_PAYMENT_SIMULATION` | `true` = tombol simulasi pembayaran muncul (matikan di produksi) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

Siapkan database dan data contoh:

```bash
npx prisma migrate dev
npx prisma db seed
```

## Menjalankan

```bash
npm run dev      # http://localhost:3000
```

### Akun demo

| Peran | Email | Password |
| --- | --- | --- |
| Admin | `admin@solemate.test` | `Admin123!` |
| Customer | `user@solemate.test` | `User123!` |

Alamat admin: `/admin`. Data seed berisi 12 produk (84 varian) dengan beberapa
stok 0 dan 1–2 untuk menguji stok habis.

## Struktur

```
src/app          halaman & route handler
src/components   komponen UI (shadcn/ui di components/ui)
src/lib          prisma, auth, midtrans, cart, format, validators
prisma           schema.prisma, seed.ts, migrations
```

## Midtrans (sandbox)

1. Daftar di <https://dashboard.sandbox.midtrans.com>, ambil **Server Key** dan
   **Client Key** dari menu *Settings → Access Keys*.
2. Isi keduanya di `.env`.
3. **Webhook butuh URL publik** agar Midtrans bisa mengirim notifikasi status
   pembayaran. Jalankan terowongan:

   ```bash
   ngrok http 3000
   ```

4. Di dashboard Midtrans → *Settings → Configuration*, isi:
   - **Payment Notification URL**: `https://<url-ngrok>/api/payments/notification`
5. Buat pesanan di aplikasi, klik **Bayar Sekarang**, selesaikan pembayaran di
   halaman Snap. Status pesanan akan berubah otomatis menjadi **Dibayar**
   setelah notifikasi masuk.

> Tanpa URL publik, pesanan tetap tertahan di `PENDING_PAYMENT` — logikanya
> sudah benar, hanya notifikasinya yang belum bisa masuk.

### Status pesanan otomatis

Status pesanan berubah otomatis tanpa konfirmasi admin, lewat dua jalur:

1. **Webhook** `POST /api/payments/notification` (paling andal, butuh URL publik).
2. **Verifikasi langsung** `POST /api/payments/sync` — dipanggil browser setelah
   jendela Snap ditutup/selesai. Server menanyakan status asli ke API Midtrans
   memakai Server Key, jadi tidak mempercayai klaim dari browser.

Tombol **Cek Status Pembayaran** di halaman pesanan memakai jalur kedua, berguna
untuk metode seperti Virtual Account yang dibayar setelah jendela Snap ditutup.

### Demo tanpa ngrok

Set `ENABLE_PAYMENT_SIMULATION="true"` di `.env`, lalu buka detail pesanan di
`/admin/orders/[id]` dan gunakan kartu **Simulasi Pembayaran** untuk meniru
notifikasi Midtrans (berhasil / ditolak / kedaluwarsa / dibatalkan). Fitur ini
hanya untuk pengembangan — matikan di produksi.

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan mode pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek tipe |
| `npx prisma studio` | Lihat/edit data |
| `npx prisma db seed` | Isi ulang data contoh (idempoten) |
