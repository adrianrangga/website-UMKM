import { NextResponse } from "next/server";

import { requireUser, setSessionCookie, signToken } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues[0]?.message ?? "Data profil tidak valid",
      );
    }

    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone && parsed.data.phone.length > 0
          ? parsed.data.phone
          : null,
      },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    // Terbitkan ulang token agar nama di navbar ikut berubah.
    const token = await signToken({
      sub: user.id,
      role: user.role,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
