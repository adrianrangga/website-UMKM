"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { PriceTag } from "@/components/price-tag";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { CartSummary } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AddressOption = {
  id: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    ok: response.ok,
    data: (await response.json().catch(() => ({}))) as Record<string, unknown>,
  };
}

export function CheckoutForm({
  cart,
  addresses,
}: {
  cart: CartSummary;
  addresses: AddressOption[];
}) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [addPending, setAddPending] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleAddAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setAddPending(true);

    try {
      const { ok, data } = await postJson("/api/addresses", {
        recipient: String(form.get("recipient") ?? ""),
        phone: String(form.get("phone") ?? ""),
        street: String(form.get("street") ?? ""),
        city: String(form.get("city") ?? ""),
        province: String(form.get("province") ?? ""),
        postalCode: String(form.get("postalCode") ?? ""),
        isDefault: addresses.length === 0,
      });

      const address = data.address as { id: string } | undefined;
      if (!ok || !address) {
        toast.error(String(data.error ?? "Gagal menyimpan alamat"));
        return;
      }

      setAddressId(address.id);
      setShowForm(false);
      formEl.reset();
      router.refresh();
      toast.success("Alamat ditambahkan");
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setAddPending(false);
    }
  }

  async function handlePlaceOrder() {
    if (!addressId) {
      toast.error("Pilih alamat pengiriman dulu");
      return;
    }
    setPending(true);

    try {
      const { ok, data } = await postJson("/api/checkout", {
        addressId,
        note: note.trim() || undefined,
      });

      const orderId = data.orderId as string | undefined;
      if (!ok || !orderId) {
        toast.error(String(data.error ?? "Gagal membuat pesanan"));
        return;
      }

      router.push(`/orders/${orderId}`);
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alamat Pengiriman</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada alamat. Tambahkan alamat pertama di bawah.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                      addressId === address.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1 accent-[var(--primary)]"
                    />
                    <span className="flex flex-col gap-0.5 text-sm">
                      <span className="font-medium">
                        {address.recipient}
                        {address.isDefault ? " (Utama)" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {address.phone}
                      </span>
                      <span className="text-muted-foreground">
                        {address.street}, {address.city}, {address.province}{" "}
                        {address.postalCode}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {showForm ? (
              <form
                onSubmit={handleAddAddress}
                className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
              >
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MapPinIcon className="size-4" />
                  Alamat baru
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="recipient">Nama penerima</Label>
                    <Input
                      id="recipient"
                      name="recipient"
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">No. telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="street">Alamat lengkap</Label>
                    <Input
                      id="street"
                      name="street"
                      autoComplete="street-address"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="city">Kota/Kabupaten</Label>
                    <Input
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      name="province"
                      autoComplete="address-level1"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="postalCode">Kode pos</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      autoComplete="postal-code"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={addPending}>
                    {addPending ? "Menyimpan..." : "Simpan alamat"}
                  </Button>
                  {addresses.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowForm(false)}
                    >
                      Batal
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setShowForm(true)}
              >
                <PlusIcon />
                Tambah alamat
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catatan (opsional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="note"
              name="note"
              aria-label="Catatan pesanan"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Contoh: kirim setelah jam 15.00"
              rows={3}
              maxLength={500}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Ringkasan Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2 text-sm">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {line.productName} · EUR {line.sizeEur} × {line.quantity}
                </span>
                <span className="shrink-0">{formatRupiah(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatRupiah(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ongkos kirim</span>
            <span>
              {cart.shippingCost === 0
                ? "Gratis"
                : formatRupiah(cart.shippingCost)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <PriceTag price={cart.total} />
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending || !addressId}
            onClick={handlePlaceOrder}
          >
            {pending ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
