import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE } from "@/lib/constants";

const ADMIN_PREFIXES = ["/admin"];
const AUTH_PREFIXES = ["/cart", "/checkout", "/orders", "/account"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Middleware berjalan di edge: verifikasi JWT pakai jose saja (tanpa Prisma).
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsAdmin = matches(pathname, ADMIN_PREFIXES);
  const needsAuth = needsAdmin || matches(pathname, AUTH_PREFIXES);
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let role: string | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      if (typeof payload.role === "string") role = payload.role;
    } catch {
      role = null;
    }
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/account/:path*",
  ],
};
