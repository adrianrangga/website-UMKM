import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adminProductCreateSchema } from "@/lib/validators";

function uniqueMessage(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[]).join(", ")
      : "slug / kode artikel";
    return `Nilai sudah dipakai: ${target}`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = adminProductCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Data produk tidak valid",
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) throw new HttpError(400, "Kategori tidak ditemukan");

    try {
      const product = await prisma.product.create({ data: parsed.data });
      return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
      const message = uniqueMessage(error);
      if (message) throw new HttpError(409, message);
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
