"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VariantCreateForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setPending(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sizeEur: form.get("sizeEur"),
          sizeUs: form.get("sizeUs"),
          color: form.get("color"),
          sku: form.get("sku"),
          stock: form.get("stock"),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menambah varian");
        return;
      }

      toast.success("Varian ditambahkan");
      formEl.reset();
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-dashed p-4"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <PlusIcon className="size-4" />
        Tambah varian
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sizeEur">Ukuran EUR</Label>
          <Input id="sizeEur" name="sizeEur" inputMode="numeric" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sizeUs">Ukuran US</Label>
          <Input id="sizeUs" name="sizeUs" inputMode="decimal" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="color">Warna</Label>
          <Input id="color" name="color" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">Stok</Label>
          <Input id="stock" name="stock" inputMode="numeric" defaultValue="0" required />
        </div>
      </div>

      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Menyimpan..." : "Tambah varian"}
        </Button>
      </div>
    </form>
  );
}
