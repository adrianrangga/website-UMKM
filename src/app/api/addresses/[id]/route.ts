import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Alamat tidak valid",
      );
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.sub },
    });
    if (!existing) throw new HttpError(404, "Alamat tidak ditemukan");

    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: session.sub },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    });

    return NextResponse.json({ address });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireCustomer();
    const { id } = await params;

    const deleted = await prisma.address.deleteMany({
      where: { id, userId: session.sub },
    });
    if (deleted.count === 0) throw new HttpError(404, "Alamat tidak ditemukan");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
