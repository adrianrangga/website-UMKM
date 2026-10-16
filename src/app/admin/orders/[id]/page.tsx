import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderStatusForm } from "@/components/order-status-form";
import { PriceTag } from "@/components/price-tag";
import { SimulatePaymentForm } from "@/components/simulate-payment-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ALLOWED_TRANSITIONS } from "@/lib/orders";
import { PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const simulateEnabled = process.env.ENABLE_PAYMENT_SIMULATION === "true";

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-foreground">
          Pesanan
        </Link>
        <span className="mx-1.5" aria-hidden>
          /
        </span>
        <span className="text-foreground">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            Dibuat {formatDateTime(order.createdAt)}
            {order.paidAt ? ` · Dibayar ${formatDateTime(order.paidAt)}` : ""}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{order.shippingRecipient}</span>
              <span className="text-muted-foreground">{order.shippingPhone}</span>
              <span className="text-muted-foreground">{order.shippingAddress}</span>
              {order.note ? (
                <span className="mt-2 text-muted-foreground">
                  Catatan: {order.note}
                </span>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{order.user.name}</span>
              <span className="text-muted-foreground">{order.user.email}</span>
              {order.user.phone ? (
                <span className="text-muted-foreground">{order.user.phone}</span>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">
                  {order.payment
                    ? PAYMENT_STATUS_LABEL[order.payment.status]
                    : "Belum ada"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipe</span>
                <span>{order.payment?.paymentType ?? "-"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ubah Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                options={ALLOWED_TRANSITIONS[order.status]}
              />
            </CardContent>
          </Card>

          {simulateEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle>Simulasi Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <SimulatePaymentForm orderId={order.id} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
