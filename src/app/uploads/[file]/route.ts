import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

// Hanya menerima nama berkas buatan server (UUID + ekstensi yang dikenal),
// sehingga tidak ada celah path traversal.
const FILE_PATTERN = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!FILE_PATTERN.test(file)) {
    return new NextResponse("Tidak ditemukan", { status: 404 });
  }

  try {
    // Disimpan di luar public/ karena public/ dibekukan saat build produksi.
    const data = await readFile(path.join(process.cwd(), "uploads", file));
    const extension = file.split(".").pop() ?? "";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Tidak ditemukan", { status: 404 });
  }
}
