import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import "./globals.css";

// Font disimpan lokal (berkas Geist dari paket Next) supaya build & dev tidak
// bergantung pada akses internet ke fonts.gstatic.com.
const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SoleMate — Marketplace Sepatu",
    template: "%s | SoleMate",
  },
  description:
    "Katalog sepatu sneakers, running, formal, dan sandal dengan pilihan ukuran dan warna, serta harga dalam Rupiah.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let cartCount = 0;
  let avatarUrl: string | null = null;

  if (session) {
    const [cart, user] = await Promise.all([
      prisma.cartItem.aggregate({
        where: { userId: session.sub },
        _sum: { quantity: true },
      }),
      prisma.user.findUnique({
        where: { id: session.sub },
        select: { avatarUrl: true },
      }),
    ]);
    cartCount = cart._sum.quantity ?? 0;
    avatarUrl = user?.avatarUrl ?? null;
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-svh flex-col">
            <SiteHeader
              user={
                session
                  ? { name: session.name, role: session.role, avatarUrl }
                  : null
              }
              cartCount={cartCount}
            />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
