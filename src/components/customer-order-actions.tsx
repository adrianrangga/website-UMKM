"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CustomerOrderActions({
  orderId,
  canCancel,
  canComplete,
}: {
  orderId: string;
  canCancel: boolean;
  canComplete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"cancel" | "complete" | null>(null);

  async function run(action: "cancel" | "complete") {
    if (
      action === "cancel" &&
      !window.confirm("Batalkan pesanan ini? Stok akan dikembalikan.")
    ) {
      return;
    }

    setPending(action);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal memperbarui pesanan");
        return;
      }

      toast.success(
        action === "cancel" ? "Pesanan dibatalkan" : "Terima kasih! Pesanan selesai",
      );
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(null);
    }
  }

  if (!canCancel && !canComplete) return null;

  return (
    <div className="flex flex-col gap-2">
      {canComplete ? (
        <Button
          type="button"
          className="w-full"
          disabled={pending !== null}
          onClick={() => run("complete")}
        >
          <CheckCircle2Icon />
          {pending === "complete" ? "Memproses..." : "Pesanan Diterima"}
        </Button>
      ) : null}

      {canCancel ? (
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          disabled={pending !== null}
          onClick={() => run("cancel")}
        >
          <XCircleIcon />
          {pending === "cancel" ? "Memproses..." : "Batalkan Pesanan"}
        </Button>
      ) : null}
    </div>
  );
}
