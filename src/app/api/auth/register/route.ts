import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword, setSessionCookie, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(200),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
  phone: z.string().trim().max(30).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 409 },
    );
  }

  // Register selalu CUSTOMER, apa pun yang dikirim client.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      phone: phone && phone.length > 0 ? phone : null,
      role: "CUSTOMER",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = await signToken({
    sub: user.id,
    role: user.role,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({ user }, { status: 201 });
}
