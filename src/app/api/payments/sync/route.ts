import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";

import { requireCustomer } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { fetchTransactionStatus } from "@/lib/midtrans";
import { applyMidtransNotification } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { syncPaymentSchema } from "@/lib/validators";

const SUDAH_LUNAS: OrderStatus[] = ["PAID", "SHIPPED", "COMPLETED"];

/**
 * Menyinkronkan status pesanan dengan status asli di Midtrans.
 * Dipanggil setelah pembayaran di Snap selesai, sehingga pesanan otomatis
 * diproses tanpa menunggu webhook maupun konfirmasi admin.
 */
export async function POST(request: Request) {
  try {
    const session = await requireCustomer();

    const body = await request.json().catch(() => null);
    const parsed = syncPaymentSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Data tidak valid");

    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: session.sub },
      include: { payment: true },
    });
    if (!order) throw new HttpError(404, "Pesanan tidak ditemukan");
    if (!order.payment) {
      throw new HttpError(404, "Pesanan ini belum punya transaksi pembayaran");
    }

    if (SUDAH_LUNAS.includes(order.status)) {
      return NextResponse.json({ status: order.status, changed: false });
    }

    const payload = await fetchTransactionStatus(order.payment.midtransOrderId);

    // Midtrans belum mencatat transaksi (belum ada percobaan pembayaran).
    if (!payload) {
      return NextResponse.json({
        status: order.status,
        changed: false,
        pendingAtMidtrans: true,
      });
    }

    await applyMidtransNotification(payload);

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true },
    });

    return NextResponse.json({
      status: updated.status,
      changed: updated.status !== order.status,
    });
  } catch (error) {
    return jsonError(error);
  }
}
