import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { HttpError } from "@/lib/http";

// SVG sengaja tidak diterima: SVG bisa memuat skrip (XSS) bila disajikan langsung.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_BYTES = 2 * 1024 * 1024;

// shortcut: berkas disimpan di folder uploads/ (hilang saat deploy serverless);
// ganti ke object storage (S3/Blob) kalau dipakai di luar localhost.
export async function saveUploadedImage(file: unknown) {
  if (!(file instanceof File)) {
    throw new HttpError(400, "Berkas tidak ditemukan");
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new HttpError(400, "Format harus PNG, JPG, atau WebP");
  }
  if (file.size > MAX_BYTES) {
    throw new HttpError(400, "Ukuran berkas maksimal 2 MB");
  }

  // Nama berkas dibuat sendiri, nama dari client tidak dipercaya.
  const fileName = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return `/uploads/${fileName}`;
}

/** Hapus berkas unggahan lama agar tidak menumpuk. Hanya untuk berkas milik kita. */
export async function removeUploadedImage(url: string | null | undefined) {
  if (!url) return;

  // Terima hanya pola nama berkas buatan server (UUID + ekstensi dikenal).
  const match = /^\/uploads\/([0-9a-f-]{36}\.(?:png|jpg|webp))$/.exec(url);
  if (!match) return;

  try {
    await unlink(path.join(process.cwd(), "uploads", match[1]));
  } catch {
    // Berkas mungkin sudah tidak ada — tidak perlu jadi error.
  }
}
