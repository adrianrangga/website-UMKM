"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export function OrderStatusForm({
  orderId,
  currentStatus,
  options,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  options: OrderStatus[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(
    options[0] ?? currentStatus,
  );
  const [pending, setPending] = useState(false);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Status <strong>{ORDER_STATUS_LABEL[currentStatus]}</strong> sudah final
        dan tidak bisa diubah lagi.
      </p>
    );
  }

  async function handleSave() {
    setPending(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal mengubah status");
        return;
      }

      toast.success("Status pesanan diperbarui");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        aria-label="Status baru"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {ORDER_STATUS_LABEL[option]}
          </option>
        ))}
      </select>

      <Button type="button" disabled={pending} onClick={handleSave}>
        {pending ? "Menyimpan..." : "Ubah status"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Membatalkan atau menandai kedaluwarsa akan mengembalikan stok.
      </p>
    </div>
  );
}
