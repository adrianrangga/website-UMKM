import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { snap } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();

    const body = await request.json().catch(() => null);
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Data tidak valid");

    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: session.sub },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, "Pesanan tidak ditemukan");
    if (order.status !== "PENDING_PAYMENT") {
      throw new HttpError(409, "Pesanan ini tidak bisa dibayar lagi");
    }

    const itemDetails = order.items.map((item) => ({
      id: item.variantId,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.productName.slice(0, 50),
    }));

    // Midtrans menuntut jumlah item_details = gross_amount, jadi ongkir jadi 1 baris.
    if (order.shippingCost > 0) {
      itemDetails.push({
        id: "SHIPPING",
        price: order.shippingCost,
        quantity: 1,
        name: "Ongkos Kirim",
      });
    }

    let transaction;
    try {
      transaction = await snap().createTransaction({
        transaction_details: {
          order_id: order.orderNumber,
          gross_amount: order.total,
        },
        item_details: itemDetails,
        customer_details: { first_name: session.name },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
        },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error(error);
      throw new HttpError(502, "Gagal membuat transaksi Midtrans");
    }

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
      },
      create: {
        orderId: order.id,
        midtransOrderId: order.orderNumber,
        grossAmount: order.total,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
      },
    });

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    return jsonError(error);
  }
}
