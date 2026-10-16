"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type VariantRow = {
  id: string;
  sizeEur: number;
  sizeUs: number;
  color: string;
  sku: string;
  stock: number;
};

export function VariantStockList({ variants }: { variants: VariantRow[] }) {
  const router = useRouter();
  const [stocks, setStocks] = useState<Record<string, string>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.id, String(variant.stock)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(variantId: string) {
    setSavingId(variantId);

    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(stocks[variantId]) }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan stok");
        return;
      }

      toast.success("Stok disimpan");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setSavingId(null);
    }
  }

  if (variants.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Produk ini belum punya varian.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ukuran</TableHead>
          <TableHead>Warna</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stok</TableHead>
          <TableHead />
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => (
          <TableRow key={variant.id}>
            <TableCell>
              EUR {variant.sizeEur}
              <span className="text-muted-foreground"> · US {variant.sizeUs}</span>
            </TableCell>
            <TableCell>{variant.color}</TableCell>
            <TableCell className="text-muted-foreground">{variant.sku}</TableCell>
            <TableCell>
              <Input
                inputMode="numeric"
                aria-label={`Stok ${variant.sku}`}
                className="w-20"
                value={stocks[variant.id] ?? ""}
                onChange={(event) =>
                  setStocks((prev) => ({
                    ...prev,
                    [variant.id]: event.target.value,
                  }))
                }
              />
            </TableCell>
            <TableCell>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  savingId === variant.id ||
                  !/^\d+$/.test(stocks[variant.id] ?? "")
                }
                onClick={() => save(variant.id)}
              >
                {savingId === variant.id ? "..." : "Simpan"}
              </Button>
            </TableCell>
            <TableCell>
              <DeleteButton
                url={`/api/admin/variants/${variant.id}`}
                confirmText={`Hapus varian ${variant.sku}?`}
                iconOnly
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
