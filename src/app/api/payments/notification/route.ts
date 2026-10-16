import { NextResponse } from "next/server";

import { HttpError, jsonError } from "@/lib/http";
import { isValidNotificationSignature, type MidtransNotification } from "@/lib/midtrans";
import { applyMidtransNotification } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | MidtransNotification
      | null;

    if (
      !payload ||
      typeof payload.order_id !== "string" ||
      typeof payload.signature_key !== "string"
    ) {
      throw new HttpError(400, "Notifikasi tidak valid");
    }

    if (!isValidNotificationSignature(payload)) {
      throw new HttpError(401, "Signature tidak valid");
    }

    await applyMidtransNotification(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
