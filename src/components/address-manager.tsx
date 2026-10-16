"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AddressInput = {
  id: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

const EMPTY: Omit<AddressInput, "id" | "isDefault"> = {
  recipient: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
};

export function AddressManager({ addresses }: { addresses: AddressInput[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AddressInput | "new" | null>(null);
  const [pending, setPending] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const values = editing === "new" || editing === null ? EMPTY : editing;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      recipient: String(form.get("recipient") ?? ""),
      phone: String(form.get("phone") ?? ""),
      street: String(form.get("street") ?? ""),
      city: String(form.get("city") ?? ""),
      province: String(form.get("province") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      isDefault: editing === "new" ? addresses.length === 0 : undefined,
    };

    setPending(true);
    try {
      const isNew = editing === "new" || editing === null;
      const response = await fetch(
        isNew ? "/api/addresses" : `/api/addresses/${editing.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan alamat");
        return;
      }

      toast.success(isNew ? "Alamat ditambahkan" : "Alamat disimpan");
      formEl.reset();
      setEditing(null);
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  async function setDefault(addressId: string) {
    setSavingId(addressId);
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(data.error ?? "Gagal mengubah alamat utama");
        return;
      }
      toast.success("Alamat utama diperbarui");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada alamat tersimpan.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-4 text-sm",
                address.isDefault && "border-primary bg-primary/5",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{address.recipient}</span>
                {address.isDefault ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Utama
                  </span>
                ) : null}
              </div>
              <span className="text-muted-foreground">{address.phone}</span>
              <span className="text-muted-foreground">
                {address.street}, {address.city}, {address.province}{" "}
                {address.postalCode}
              </span>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(address)}
                >
                  Ubah
                </Button>
                {address.isDefault ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={savingId === address.id}
                    onClick={() => setDefault(address.id)}
                  >
                    Jadikan utama
                  </Button>
                )}
                <DeleteButton
                  url={`/api/addresses/${address.id}`}
                  confirmText={`Hapus alamat "${address.recipient}"?`}
                  iconOnly
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing === null ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setEditing("new")}
        >
          <PlusIcon />
          Tambah alamat
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPinIcon className="size-4" />
            {editing === "new" ? "Alamat baru" : "Ubah alamat"}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipient">Nama penerima</Label>
              <Input
                id="recipient"
                name="recipient"
                autoComplete="name"
                defaultValue={values.recipient}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">No. telepon</Label>
              <Input
                id="phone"
                name="phone"
                autoComplete="tel"
                defaultValue={values.phone}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="street">Alamat lengkap</Label>
              <Input
                id="street"
                name="street"
                autoComplete="street-address"
                defaultValue={values.street}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Kota/Kabupaten</Label>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                defaultValue={values.city}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="province">Provinsi</Label>
              <Input
                id="province"
                name="province"
                autoComplete="address-level1"
                defaultValue={values.province}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postalCode">Kode pos</Label>
              <Input
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                defaultValue={values.postalCode}
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(null)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
