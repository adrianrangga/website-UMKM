"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestPaymentSync } from "@/lib/payment-sync-client";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export function SyncPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    const result = await requestPaymentSync(orderId);

    if (result.error) {
      toast.error(result.error);
    } else if (result.changed && result.status) {
      const label =
        ORDER_STATUS_LABEL[result.status as keyof typeof ORDER_STATUS_LABEL] ??
        result.status;
      toast.success(`Status diperbarui: ${label}`);
    } else if (result.pendingAtMidtrans) {
      toast("Midtrans belum mencatat transaksi ini. Selesaikan pembayaran dulu.");
    } else {
      toast("Belum ada perubahan status dari Midtrans");
    }

    router.refresh();
    setPending(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={handleClick}
    >
      <RefreshCwIcon />
      {pending ? "Memeriksa..." : "Cek Status Pembayaran"}
    </Button>
  );
}
