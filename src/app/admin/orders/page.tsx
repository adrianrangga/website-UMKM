import Link from "next/link";
import { PackageOpenIcon } from "lucide-react";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/validators";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
}) {
  const { status, page } = await searchParams;
  const statusParam = typeof status === "string" ? status : undefined;
  const statusFilter = ORDER_STATUSES.find((value) => value === statusParam);

  const pageParam = typeof page === "string" ? Number(page) : 1;
  const current = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const where = statusFilter ? { status: statusFilter } : {};

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefFor(target: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        method="get"
        action="/admin/orders"
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Filter status</Label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Semua status</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">
          Terapkan
        </Button>
        <Link
          href="/admin/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Reset
        </Link>
      </form>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpenIcon className="size-10 text-muted-foreground" />
          <p className="font-heading text-lg font-medium">Tidak ada pesanan</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {statusFilter
              ? "Tidak ada pesanan dengan status ini."
              : "Belum ada pesanan sama sekali."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total} pesanan</p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <span className="block">{order.user.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {order.user.email}
                    </span>
                  </TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>{order._count.items}</TableCell>
                  <TableCell>{formatRupiah(order.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      Kelola
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={current}
            totalPages={totalPages}
            hrefFor={hrefFor}
          />
        </>
      )}
    </div>
  );
}
