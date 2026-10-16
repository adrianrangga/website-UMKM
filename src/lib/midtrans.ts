import { createHash } from "node:crypto";

import midtransClient from "midtrans-client";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

import { HttpError } from "@/lib/http";

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Server Key hanya dipakai di server; JANGAN pernah bocor ke kode client.
function requireServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || key.includes("xxxx")) {
    throw new HttpError(
      503,
      "Midtrans belum dikonfigurasi: isi MIDTRANS_SERVER_KEY di .env",
    );
  }
  return key;
}

export function snap() {
  return new midtransClient.Snap({
    isProduction: IS_PRODUCTION,
    serverKey: requireServerKey(),
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  });
}

export function coreApi() {
  return new midtransClient.CoreApi({
    isProduction: IS_PRODUCTION,
    serverKey: requireServerKey(),
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  });
}

/**
 * Ambil status transaksi LANGSUNG dari Midtrans memakai Server Key.
 * Mengembalikan `null` bila Midtrans belum mencatat transaksi (belum ada
 * percobaan pembayaran) — itu kondisi normal, bukan error.
 * Callback dari browser hanya pemicu, bukan bukti bayar.
 */
export async function fetchTransactionStatus(
  orderId: string,
): Promise<MidtransNotification | null> {
  try {
    const raw = await coreApi().transaction.status(orderId);

    return {
      order_id: String(raw.order_id ?? orderId),
      status_code: String(raw.status_code ?? "200"),
      gross_amount: String(raw.gross_amount ?? ""),
      // Signature tidak dipakai di jalur ini: data datang dari API Midtrans
      // (terautentikasi Server Key), bukan dari request pihak ketiga.
      signature_key: "verified-via-api",
      transaction_status: String(raw.transaction_status ?? ""),
      fraud_status: raw.fraud_status,
      payment_type: raw.payment_type,
      midtrans_response: raw,
    } as MidtransNotification;
  } catch (error) {
    if (error instanceof HttpError) throw error;

    // midtrans-client mengisi httpStatusCode sebagai STRING ("404").
    const httpStatus = Number(
      (error as { httpStatusCode?: unknown }).httpStatusCode,
    );
    if (httpStatus === 404) return null;

    console.error(error);
    throw new HttpError(502, "Gagal memeriksa status pembayaran ke Midtrans");
  }
}

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
};

/**
 * signature_key = sha512(order_id + status_code + gross_amount + server_key).
 * Dipakai untuk memastikan notifikasi benar-benar dari Midtrans.
 */
export function isValidNotificationSignature(payload: MidtransNotification) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const expected = createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest("hex");

  return expected === payload.signature_key;
}

/** Terjemahkan status Midtrans ke status Order & Payment kita. */
export function mapTransactionStatus(payload: MidtransNotification): {
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
} {
  const { transaction_status: status, fraud_status: fraud } = payload;

  if (status === "capture" || status === "settlement") {
    if (status === "capture" && fraud === "challenge") {
      return { paymentStatus: "PENDING" };
    }
    if (fraud === "deny") {
      return { paymentStatus: "FAILED" };
    }
    return { paymentStatus: "PAID", orderStatus: "PAID" };
  }

  switch (status) {
    case "pending":
      return { paymentStatus: "PENDING" };
    case "deny":
      return { paymentStatus: "FAILED" };
    case "cancel":
      return { paymentStatus: "CANCELLED", orderStatus: "CANCELLED" };
    case "expire":
      return { paymentStatus: "EXPIRED", orderStatus: "EXPIRED" };
    case "refund":
    case "partial_refund":
      return { paymentStatus: "REFUNDED" };
    default:
      return {};
  }
}
