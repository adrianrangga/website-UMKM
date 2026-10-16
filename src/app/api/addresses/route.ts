import { NextResponse } from "next/server";

import { requireCustomer } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await requireCustomer();

    const addresses = await prisma.address.findMany({
      where: { userId: session.sub },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();

    const body = await request.json().catch(() => null);
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Alamat tidak valid",
      );
    }

    const count = await prisma.address.count({ where: { userId: session.sub } });
    // Alamat pertama otomatis jadi default.
    const isDefault = parsed.data.isDefault ?? count === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: session.sub },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: { ...parsed.data, isDefault, userId: session.sub },
      });
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
