import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";

import { requireCustomer } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { applyOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { customerOrderActionSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

// Aksi customer lebih sempit daripada admin: batalkan hanya sebelum dibayar,
// dan tandai selesai hanya setelah dikirim.
const REQUIRED_STATUS: Record<"cancel" | "complete", OrderStatus> = {
  cancel: "PENDING_PAYMENT",
  complete: "SHIPPED",
};

const TARGET_STATUS: Record<"cancel" | "complete", OrderStatus> = {
  cancel: "CANCELLED",
  complete: "COMPLETED",
};

const ERROR_MESSAGE: Record<"cancel" | "complete", string> = {
  cancel: "Hanya pesanan yang belum dibayar bisa dibatalkan",
  complete: "Pesanan belum dikirim, belum bisa ditandai diterima",
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = customerOrderActionSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Aksi tidak valid");

    const action = parsed.data.action;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId: session.sub },
        include: { items: true, payment: true },
      });
      if (!order) throw new HttpError(404, "Pesanan tidak ditemukan");

      if (order.status !== REQUIRED_STATUS[action]) {
        throw new HttpError(409, ERROR_MESSAGE[action]);
      }

      await applyOrderStatus(tx, order, TARGET_STATUS[action]);

      // Batalkan juga pembayarannya bila pesanan dibatalkan.
      if (action === "cancel" && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "CANCELLED" },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
