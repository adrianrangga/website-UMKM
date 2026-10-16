"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { PriceTag } from "@/components/price-tag";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CartSummary } from "@/lib/cart";
import { FREE_SHIPPING_MIN } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartView({ initialCart }: { initialCart: CartSummary }) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function mutate(itemId: string, init: RequestInit) {
    setPendingId(itemId);

    try {
      const response = await fetch(`/api/cart/${itemId}`, init);
      const data = (await response.json().catch(() => ({}))) as
        | CartSummary
        | { error?: string };

      if (!response.ok) {
        toast.error(
          (data as { error?: string }).error ?? "Gagal memperbarui keranjang",
        );
        return;
      }

      setCart(data as CartSummary);
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPendingId(null);
    }
  }

  function changeQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    void mutate(itemId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <ShoppingCartIcon className="size-10 text-muted-foreground" />
        <p className="font-heading text-lg font-medium">Keranjang kosong</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Belum ada sepatu di keranjangmu.
        </p>
        <Link href="/products" className={cn(buttonVariants())}>
          Mulai belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="flex flex-col gap-4">
        {cart.lines.map((line) => {
          const busy = pendingId === line.id;

          return (
            <li key={line.id}>
              <Card>
                <CardContent className="flex gap-4 pt-4">
                  <Link
                    href={`/products/${line.productSlug}`}
                    className="shrink-0"
                  >
                    <Image
                      src={line.imageUrl}
                      alt={line.productName}
                      width={200}
                      height={200}
                      unoptimized
                      className="size-20 rounded-lg bg-muted object-contain p-2 sm:size-24"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/products/${line.productSlug}`}
                      className="truncate font-medium hover:text-primary"
                    >
                      {line.productName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {line.productBrand} · EUR {line.sizeEur} / {line.color}
                    </p>
                    <PriceTag price={line.unitPrice} className="text-sm" />

                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Kurangi jumlah"
                        disabled={busy || line.quantity <= 1}
                        onClick={() =>
                          changeQuantity(line.id, line.quantity - 1)
                        }
                      >
                        <MinusIcon />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Tambah jumlah"
                        disabled={busy || line.quantity >= line.stock}
                        onClick={() =>
                          changeQuantity(line.id, line.quantity + 1)
                        }
                      >
                        <PlusIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Hapus item"
                        disabled={busy}
                        onClick={() =>
                          void mutate(line.id, { method: "DELETE" })
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <PriceTag price={line.lineTotal} className="text-sm" />
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({cart.itemCount} item)
            </span>
            <span>{formatRupiah(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ongkos kirim</span>
            <span>
              {cart.shippingCost === 0 ? "Gratis" : formatRupiah(cart.shippingCost)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <PriceTag price={cart.total} />
          </div>

          {cart.shippingCost > 0 ? (
            <p className="text-xs text-muted-foreground">
              Gratis ongkir untuk pembelian minimal{" "}
              {formatRupiah(FREE_SHIPPING_MIN)}.
            </p>
          ) : null}

          <Link href="/checkout" className={cn(buttonVariants(), "w-full")}>
            Checkout
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
