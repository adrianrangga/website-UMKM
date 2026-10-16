import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { applyOrderStatus, canTransition } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { adminOrderStatusSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = adminOrderStatusSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Status tidak valid");

    const nextStatus = parsed.data.status;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true, payment: true },
      });
      if (!order) throw new HttpError(404, "Pesanan tidak ditemukan");

      if (nextStatus === order.status) return;
      if (!canTransition(order.status, nextStatus)) {
        throw new HttpError(
          409,
          `Tidak bisa mengubah status dari ${order.status} ke ${nextStatus}`,
        );
      }

      await applyOrderStatus(tx, order, nextStatus);

      // Selaraskan status pembayaran saat pesanan dibatalkan/kedaluwarsa.
      if (
        order.payment &&
        (nextStatus === "CANCELLED" || nextStatus === "EXPIRED")
      ) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: nextStatus === "CANCELLED" ? "CANCELLED" : "EXPIRED",
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
