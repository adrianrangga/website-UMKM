import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adminProductUpdateSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = adminProductUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Data produk tidak valid",
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new HttpError(404, "Produk tidak ditemukan");

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) throw new HttpError(400, "Kategori tidak ditemukan");

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });
    if (!product) throw new HttpError(404, "Produk tidak ditemukan");

    const variantIds = product.variants.map((variant) => variant.id);

    // Pesanan lama menyimpan snapshot harga/nama, jadi produk yang pernah
    // dipesan lebih baik dinonaktifkan daripada dihapus.
    const orderedCount = await prisma.orderItem.count({
      where: { variantId: { in: variantIds } },
    });
    if (orderedCount > 0) {
      throw new HttpError(
        409,
        "Produk sudah pernah dipesan. Nonaktifkan saja daripada dihapus.",
      );
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { variantId: { in: variantIds } } }),
      prisma.variant.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { id: product.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
