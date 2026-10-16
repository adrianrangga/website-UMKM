import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { shippingCostFor } from "@/lib/cart";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";

// shortcut: suffix acak 4 karakter sangat jarang bisa bentrok; ganti ke
// sequence DB kalau volume pesanan tinggi.
function createOrderNumber(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();

    const body = await request.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Data checkout tidak valid",
      );
    }
    const { addressId, note } = parsed.data;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.sub },
    });
    if (!address) throw new HttpError(400, "Alamat tidak ditemukan");

    const orderId = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: session.sub },
        include: { variant: { include: { product: true } } },
      });

      if (cartItems.length === 0) {
        throw new HttpError(400, "Keranjang masih kosong");
      }

      // 1) Subtotal dihitung dari harga di DB, bukan angka dari client.
      let subtotal = 0;
      const lines = cartItems.map((item) => {
        const unitPrice =
          item.variant.priceOverride ?? item.variant.product.basePrice;
        subtotal += unitPrice * item.quantity;
        return { item, unitPrice };
      });

      // 2) Kurangi stok dengan kondisi `stock >= qty` agar aman dari race.
      for (const { item } of lines) {
        const updated = await tx.variant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new HttpError(
            409,
            `Stok ${item.variant.product.name} tidak cukup`,
          );
        }
      }

      // 3) Ongkir flat, gratis di atas ambang tertentu.
      const shippingCost = shippingCostFor(subtotal);
      const total = subtotal + shippingCost;
      const orderNumber = createOrderNumber();

      // 4) Order + OrderItem (snapshot) + Payment(PENDING).
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.sub,
          status: "PENDING_PAYMENT",
          subtotal,
          shippingCost,
          total,
          shippingRecipient: address.recipient,
          shippingPhone: address.phone,
          shippingAddress: `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`,
          note: note && note.length > 0 ? note : null,
          items: {
            create: lines.map(({ item, unitPrice }) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantLabel: `EUR ${item.variant.sizeEur} / ${item.variant.color}`,
              unitPrice,
              quantity: item.quantity,
            })),
          },
          payment: {
            create: { midtransOrderId: orderNumber, grossAmount: total },
          },
        },
        select: { id: true },
      });

      // 5) Kosongkan keranjang.
      await tx.cartItem.deleteMany({ where: { userId: session.sub } });

      return order.id;
    });

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
