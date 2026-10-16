import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpenIcon } from "lucide-react";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { PriceTag } from "@/components/price-tag";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pesanan Saya" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  if (session.role !== "CUSTOMER") redirect("/");

  const orders = await prisma.order.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { quantity: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">
        Pesanan Saya
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpenIcon className="size-10 text-muted-foreground" />
          <p className="font-heading text-lg font-medium">Belum ada pesanan</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Pesanan yang kamu buat akan muncul di sini.
          </p>
          <Link href="/products" className={cn(buttonVariants())}>
            Mulai belanja
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );

            return (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} className="block">
                  <Card className="transition-shadow hover:shadow-md hover:ring-primary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)} · {itemCount} item
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <OrderStatusBadge status={order.status} />
                        <PriceTag price={order.total} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
