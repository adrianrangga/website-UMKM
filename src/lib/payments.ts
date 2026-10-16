import { Prisma } from "@prisma/client";

import { HttpError } from "@/lib/http";
import {
  mapTransactionStatus,
  type MidtransNotification,
} from "@/lib/midtrans";
import { applyOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const LUNAS: readonly string[] = ["PAID", "SHIPPED", "COMPLETED"];

/**
 * Terapkan notifikasi Midtrans ke Payment + Order.
 * Idempoten: order yang sudah lunas diabaikan, stok hanya dikembalikan sekali.
 * Verifikasi signature adalah tugas pemanggil (route webhook).
 */
export async function applyMidtransNotification(payload: MidtransNotification) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { midtransOrderId: payload.order_id },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new HttpError(404, "Pembayaran tidak ditemukan");

    const { order } = payment;
    if (LUNAS.includes(order.status)) return;

    const outcome = mapTransactionStatus(payload);

    if (outcome.paymentStatus) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: outcome.paymentStatus,
          paymentType: payload.payment_type ?? payment.paymentType,
          // payload notifikasi disimpan utuh; bentuknya JSON dari Midtrans.
          rawNotification: payload as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (outcome.orderStatus) {
      await applyOrderStatus(
        tx,
        { id: order.id, status: order.status, items: order.items },
        outcome.orderStatus,
      );
    }
  });
}
