import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateCartItemSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { itemId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Jumlah tidak valid");

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: session.sub },
      include: { variant: { include: { product: true } } },
    });
    if (!item) throw new HttpError(404, "Item tidak ditemukan");

    if (parsed.data.quantity > item.variant.stock) {
      throw new HttpError(
        409,
        `Stok ${item.variant.product.name} tidak cukup`,
      );
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.data.quantity },
    });

    return NextResponse.json(await getCart(session.sub));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { itemId } = await params;

    const deleted = await prisma.cartItem.deleteMany({
      where: { id: itemId, userId: session.sub },
    });
    if (deleted.count === 0) throw new HttpError(404, "Item tidak ditemukan");

    return NextResponse.json(await getCart(session.sub));
  } catch (error) {
    return jsonError(error);
  }
}
