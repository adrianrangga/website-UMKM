import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";

// SVG sengaja tidak diterima: SVG bisa memuat skrip (XSS) bila disajikan langsung.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_BYTES = 2 * 1024 * 1024;

// shortcut: berkas disimpan di folder uploads/ (hilang saat deploy serverless);
// ganti ke object storage (S3/Blob) kalau dipakai di luar localhost.
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

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

    return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
