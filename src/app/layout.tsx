import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  if (session) {
    const result = await prisma.cartItem.aggregate({
      where: { userId: session.sub },
      _sum: { quantity: true },
    });
    cartCount = result._sum.quantity ?? 0;
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
                session ? { name: session.name, role: session.role } : null
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
