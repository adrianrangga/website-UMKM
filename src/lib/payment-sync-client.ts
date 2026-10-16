export type SyncResult = {
  status?: string;
  changed?: boolean;
  pendingAtMidtrans?: boolean;
  error?: string;
};

/** Minta server memverifikasi status pembayaran ke Midtrans. */
export async function requestPaymentSync(orderId: string): Promise<SyncResult> {
  try {
    const response = await fetch("/api/payments/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = (await response.json().catch(() => ({}))) as SyncResult;

    if (!response.ok) {
      return { error: data.error ?? "Gagal memeriksa status pembayaran" };
    }
    return data;
  } catch {
    return { error: "Tidak dapat terhubung ke server" };
  }
}
