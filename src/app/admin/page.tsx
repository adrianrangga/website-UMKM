import Link from "next/link";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { PriceTag } from "@/components/price-tag";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    revenue,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Produk aktif", value: `${activeProducts}/${totalProducts}` },
    { label: "Total pesanan", value: String(totalOrders) },
    { label: "Menunggu pembayaran", value: String(pendingOrders) },
    { label: "Pendapatan (lunas)", value: `Rp ${(revenue._sum.total ?? 0).toLocaleString("id-ID")}` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-heading text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold">Pesanan Terbaru</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Belum ada pesanan.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="block">
                  <Card className="transition-shadow hover:shadow-md hover:ring-primary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.user.name} · {formatDateTime(order.createdAt)}
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
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
