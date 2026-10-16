import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { addToCartSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await requireCustomer();
    return NextResponse.json(await getCart(session.sub));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();

    const body = await request.json().catch(() => null);
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Data keranjang tidak valid");

    const { variantId, quantity } = parsed.data;

    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw new HttpError(404, "Varian tidak ditemukan");

    const existing = await prisma.cartItem.findUnique({
      where: { userId_variantId: { userId: session.sub, variantId } },
    });

    // Item yang sudah ada: quantity ditambahkan.
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > variant.stock) {
      throw new HttpError(409, `Stok ${variant.product.name} tidak cukup`);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { userId: session.sub, variantId, quantity },
      });
    }

    return NextResponse.json(await getCart(session.sub), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
