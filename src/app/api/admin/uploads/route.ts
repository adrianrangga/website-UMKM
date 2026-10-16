import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { saveUploadedImage } from "@/lib/uploads";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const form = await request.formData().catch(() => null);
    const url = await saveUploadedImage(form?.get("file"));

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
