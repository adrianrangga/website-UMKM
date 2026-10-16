/** Format angka Rupiah tanpa desimal, mis. 1250000 -> "Rp 1.250.000". */
export function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

/** Format tanggal & jam dalam locale Indonesia. */
export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
