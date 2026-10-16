import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CustomerOrderActions } from "@/components/customer-order-actions";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PayNowButton } from "@/components/pay-now-button";
import { PriceTag } from "@/components/price-tag";
import { SyncPaymentButton } from "@/components/sync-payment-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Detail Pesanan" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  if (session.role !== "CUSTOMER") redirect("/");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.sub },
    include: { items: true, payment: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground">
          Pesanan Saya
        </Link>
        <span className="mx-1.5" aria-hidden>
          /
        </span>
        <span className="text-foreground">{order.orderNumber}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Item Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-muted-foreground">
                      {item.variantLabel} · {item.quantity} ×{" "}
                      {formatRupiah(item.unitPrice)}
                    </span>
                  </div>
                  <span className="shrink-0">
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos kirim</span>
                <span>
                  {order.shippingCost === 0
                    ? "Gratis"
                    : formatRupiah(order.shippingCost)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <PriceTag price={order.total} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{order.shippingRecipient}</span>
              <span className="text-muted-foreground">
                {order.shippingPhone}
              </span>
              <span className="text-muted-foreground">
                {order.shippingAddress}
              </span>
              {order.note ? (
                <span className="mt-2 text-muted-foreground">
                  Catatan: {order.note}
                </span>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">
                  {order.payment
                    ? PAYMENT_STATUS_LABEL[order.payment.status]
                    : "Belum ada"}
                </Badge>
              </div>
              {order.status === "PENDING_PAYMENT" ? (
                <div className="flex flex-col gap-2">
                  <PayNowButton orderId={order.id} />
                  <SyncPaymentButton orderId={order.id} />
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {order.status === "PENDING_PAYMENT"
                  ? "Status pesanan diperbarui otomatis setelah pembayaran terverifikasi."
                  : "Pesanan ini sudah tidak menunggu pembayaran."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerOrderActions
                orderId={order.id}
                canCancel={order.status === "PENDING_PAYMENT"}
                canComplete={order.status === "SHIPPED"}
              />
              {order.status !== "PENDING_PAYMENT" &&
              order.status !== "SHIPPED" ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada aksi yang tersedia untuk status ini.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
