import type { OrderStatus, Prisma } from "@prisma/client";

/** Status yang mengembalikan stok ke gudang. */
export const STOCK_RETURNING_STATUSES: OrderStatus[] = ["CANCELLED", "EXPIRED"];

/** Transisi status yang diizinkan untuk admin. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED", "EXPIRED"],
  PAID: ["SHIPPED", "COMPLETED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

type OrderWithItems = {
  id: string;
  status: OrderStatus;
  items: { variantId: string; quantity: number }[];
};

/**
 * Ubah status order di dalam transaksi. Bila masuk CANCELLED/EXPIRED, stok
 * dikembalikan SEKALI saja: `updateMany` bersyarat membuatnya idempoten.
 */
export async function applyOrderStatus(
  tx: Prisma.TransactionClient,
  order: OrderWithItems,
  nextStatus: OrderStatus,
) {
  if (nextStatus === order.status) return false;

  const returnsStock = STOCK_RETURNING_STATUSES.includes(nextStatus);

  const updated = await tx.order.updateMany({
    where: {
      id: order.id,
      ...(returnsStock ? { status: { notIn: STOCK_RETURNING_STATUSES } } : {}),
    },
    data: {
      status: nextStatus,
      ...(nextStatus === "PAID" ? { paidAt: new Date() } : {}),
    },
  });

  if (returnsStock && updated.count > 0) {
    for (const item of order.items) {
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  return updated.count > 0;
}
