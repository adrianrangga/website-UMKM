"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestPaymentSync } from "@/lib/payment-sync-client";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
const SNAP_URL = isProduction
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

export function PayNowButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  // Callback Snap hanya PEMICU; status sebenarnya diverifikasi server ke Midtrans.
  async function verifyAfterPayment() {
    const result = await requestPaymentSync(orderId);

    if (result.error) {
      toast.error(result.error);
    } else if (result.status) {
      const label =
        ORDER_STATUS_LABEL[result.status as keyof typeof ORDER_STATUS_LABEL] ??
        result.status;
      toast.success(`Status pesanan: ${label}`);
    }

    router.refresh();
  }

  async function handlePay() {
    setPending(true);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        token?: string;
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal memulai pembayaran");
        return;
      }

      if (window.snap && data.token) {
        window.snap.pay(data.token, {
          onSuccess: () => void verifyAfterPayment(),
          onPending: () => void verifyAfterPayment(),
          onError: () => toast.error("Pembayaran gagal"),
          onClose: () => void verifyAfterPayment(),
        });
      } else if (data.redirectUrl) {
        // Fallback bila snap.js belum termuat.
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Snap Midtrans tidak tersedia");
      }
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Script src={SNAP_URL} data-client-key={clientKey} strategy="lazyOnload" />
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={handlePay}
      >
        {pending ? "Memproses..." : "Bayar Sekarang"}
      </Button>
    </>
  );
}
