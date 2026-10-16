import { NextResponse } from "next/server";

/** Error dengan status HTTP yang siap dikirim sebagai JSON. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Ubah error menjadi respons `{ error: string }` dengan status yang tepat. */
export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: "Terjadi kesalahan pada server" },
    { status: 500 },
  );
}
