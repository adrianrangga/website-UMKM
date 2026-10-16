import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { removeUploadedImage, saveUploadedImage } from "@/lib/uploads";

/** Unggah foto profil untuk user yang sedang masuk. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();

    const form = await request.formData().catch(() => null);
    const avatarUrl = await saveUploadedImage(form?.get("file"));

    const sebelumnya = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { avatarUrl: true },
    });

    await prisma.user.update({
      where: { id: session.sub },
      data: { avatarUrl },
    });

    // Foto lama dibuang supaya tidak menumpuk di folder uploads/.
    await removeUploadedImage(sebelumnya?.avatarUrl);

    return NextResponse.json({ avatarUrl }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

/** Hapus foto profil (kembali ke inisial nama). */
export async function DELETE() {
  try {
    const session = await requireUser();

    const sebelumnya = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { avatarUrl: true },
    });

    await prisma.user.update({
      where: { id: session.sub },
      data: { avatarUrl: null },
    });

    await removeUploadedImage(sebelumnya?.avatarUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
