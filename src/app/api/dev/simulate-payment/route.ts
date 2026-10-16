import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import type { MidtransNotification } from "@/lib/midtrans";
import { applyMidtransNotification } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { simulatePaymentSchema } from "@/lib/validators";

/**
 * Khusus pengembangan: meniru notifikasi Midtrans tanpa perlu URL publik/ngrok.
 * Nonaktif kecuali ENABLE_PAYMENT_SIMULATION="true", dan tetap wajib admin.
 */
export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_PAYMENT_SIMULATION !== "true") {
      throw new HttpError(404, "Fitur simulasi pembayaran tidak aktif");
    }

    await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = simulatePaymentSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Data simulasi tidak valid");

    const payment = await prisma.payment.findUnique({
      where: { orderId: parsed.data.orderId },
    });
    if (!payment) throw new HttpError(404, "Pembayaran tidak ditemukan");

    const payload: MidtransNotification = {
      order_id: payment.midtransOrderId,
      status_code: "200",
      gross_amount: `${payment.grossAmount}.00`,
      signature_key: "simulasi-lokal",
      transaction_status: parsed.data.outcome,
      payment_type: "simulasi",
    };

    await applyMidtransNotification(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
