"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const OUTCOMES = [
  { value: "settlement", label: "Berhasil dibayar" },
  { value: "pending", label: "Menunggu pembayaran" },
  { value: "deny", label: "Ditolak bank" },
  { value: "cancel", label: "Dibatalkan" },
  { value: "expire", label: "Kedaluwarsa" },
] as const;

/** Alat bantu pengembangan: meniru notifikasi Midtrans tanpa ngrok. */
export function SimulatePaymentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<string>("settlement");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    try {
      const response = await fetch("/api/dev/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, outcome }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal mensimulasikan pembayaran");
        return;
      }

      toast.success("Notifikasi simulasi diterapkan");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        aria-label="Hasil simulasi"
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {OUTCOMES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Memproses..." : "Terapkan simulasi"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Hanya untuk pengembangan (tanpa webhook Midtrans). Nonaktif bila
        ENABLE_PAYMENT_SIMULATION tidak diset.
      </p>
    </form>
  );
}
