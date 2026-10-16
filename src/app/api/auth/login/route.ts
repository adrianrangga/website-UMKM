import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(200),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
});

// Pesan seragam: jangan bocorkan apakah email terdaftar atau password salah.
const GENERIC_ERROR = "Email atau password salah";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await signToken({
    sub: user.id,
    role: user.role,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
