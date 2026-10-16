import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireUser();

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) throw new HttpError(401, "Sesi tidak valid");

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
