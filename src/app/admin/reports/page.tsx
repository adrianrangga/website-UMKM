import type { OrderStatus } from "@prisma/client";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { PriceTag } from "@/components/price-tag";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/validators";

export const dynamic = "force-dynamic";

const PAID_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "COMPLETED"];
const DAYS = 7;

export default async function AdminReportsPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWindow = new Date(startOfToday);
  startWindow.setDate(startWindow.getDate() - (DAYS - 1));

  const [today, week, month, allTime, byStatus, windowOrders, topRaw, lowStock] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: PAID_STATUSES },
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: startWindow } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: PAID_STATUSES },
          createdAt: { gte: new Date(startOfToday.getTime() - 29 * 86400000) },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: PAID_STATUSES } },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.findMany({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: startWindow } },
        select: { createdAt: true, total: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { status: { in: PAID_STATUSES } } },
        _sum: { quantity: true },
      }),
      prisma.variant.findMany({
        where: { stock: { lte: 2 } },
        orderBy: { stock: "asc" },
        take: 6,
        include: { product: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { label: "Pendapatan hari ini", value: today._sum.total ?? 0 },
    { label: `Pendapatan ${DAYS} hari`, value: week._sum.total ?? 0 },
    { label: "Pendapatan 30 hari", value: month._sum.total ?? 0 },
    { label: "Pendapatan total", value: allTime._sum.total ?? 0 },
  ];

  const dailyTotals = Array.from({ length: DAYS }, (_, index) => {
    const day = new Date(startWindow);
    day.setDate(startWindow.getDate() + index);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    return {
      label: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(day),
      total: windowOrders
        .filter((order) => order.createdAt >= day && order.createdAt < next)
        .reduce((sum, order) => sum + order.total, 0),
    };
  });

  const maxDaily = Math.max(1, ...dailyTotals.map((item) => item.total));

  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: byStatus.find((row) => row.status === status)?._count._all ?? 0,
  }));

  const topProducts = [...topRaw]
    .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <PriceTag price={stat.value} className="text-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendapatan {DAYS} Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-end gap-2">
          {dailyTotals.map((item) => (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(2, (item.total / maxDaily) * 100)}%` }}
                title={formatRupiah(item.total)}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada penjualan.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Terjual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((row) => (
                    <TableRow key={row.productName}>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{row._sum.quantity ?? 0} pcs</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan per Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {statusCounts.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between text-sm"
              >
                <OrderStatusBadge status={row.status} />
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok Menipis (≤ 2)</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Semua varian stoknya masih aman.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead>Sisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>{variant.product.name}</TableCell>
                    <TableCell>
                      EUR {variant.sizeEur} / {variant.color}
                    </TableCell>
                    <TableCell>{variant.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
