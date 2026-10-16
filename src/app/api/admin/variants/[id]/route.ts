import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adminVariantSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = adminVariantSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Stok tidak valid",
      );
    }

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) throw new HttpError(404, "Varian tidak ditemukan");

    const updated = await prisma.variant.update({
      where: { id },
      data: { stock: parsed.data.stock },
    });

    return NextResponse.json({ variant: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const variant = await prisma.variant.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!variant) throw new HttpError(404, "Varian tidak ditemukan");

    if (variant._count.orderItems > 0) {
      throw new HttpError(
        409,
        "Varian sudah pernah dipesan, tidak bisa dihapus",
      );
    }

    // Item keranjang yang menunjuk varian ini ikut dibersihkan.
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { variantId: variant.id } }),
      prisma.variant.delete({ where: { id: variant.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
