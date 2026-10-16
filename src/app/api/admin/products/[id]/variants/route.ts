import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adminVariantCreateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(404, "Produk tidak ditemukan");

    const body = await request.json().catch(() => null);
    const parsed = adminVariantCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Data varian tidak valid",
      );
    }

    const duplicate = await prisma.variant.findUnique({
      where: {
        productId_sizeEur_color: {
          productId,
          sizeEur: parsed.data.sizeEur,
          color: parsed.data.color,
        },
      },
    });
    if (duplicate) {
      throw new HttpError(
        409,
        `Varian EUR ${parsed.data.sizeEur} / ${parsed.data.color} sudah ada`,
      );
    }

    try {
      const variant = await prisma.variant.create({
        data: { ...parsed.data, productId },
      });
      return NextResponse.json({ variant }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HttpError(409, "SKU sudah dipakai varian lain");
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
