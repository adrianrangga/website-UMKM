"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [{ href: "/products", label: "Katalog" }];

export type HeaderUser = { name: string; role: "CUSTOMER" | "ADMIN" };

export function SiteHeader({
  user,
  cartCount,
}: {
  user: HeaderUser | null;
  cartCount: number;
}) {
  const router = useRouter();

  // Keranjang hanya untuk pembeli (dan tamu sebelum masuk).
  const showCart = user?.role !== "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBagIcon className="size-4" />
          </span>
          SoleMate
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-1">
          {showCart ? (
            <Link
              href="/cart"
              aria-label={
                cartCount > 0 ? `Keranjang, ${cartCount} item` : "Keranjang"
              }
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative",
              )}
            >
              <ShoppingCartIcon />
              {cartCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost" }), "gap-2")}
              >
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate sm:inline">
                  {user.name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {isCustomer ? (
                  <DropdownMenuItem render={<Link href="/orders" />}>
                    <PackageIcon />
                    Pesanan Saya
                  </DropdownMenuItem>
                ) : null}
                {isCustomer ? (
                  <DropdownMenuItem render={<Link href="/account" />}>
                    <UserIcon />
                    Akun Saya
                  </DropdownMenuItem>
                ) : null}
                {user.role === "ADMIN" ? (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    Panel Admin
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOutIcon />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              Masuk
            </Link>
          )}

          <Sheet>
            <SheetTrigger
              aria-label="Buka menu"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "md:hidden",
              )}
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {showCart ? (
                  <Link
                    href="/cart"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    Keranjang{cartCount > 0 ? ` (${cartCount})` : ""}
                  </Link>
                ) : null}
                {isCustomer ? (
                  <Link
                    href="/orders"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    Pesanan Saya
                  </Link>
                ) : null}
                {isCustomer ? (
                  <Link
                    href="/account"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    Akun Saya
                  </Link>
                ) : null}
                {user?.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    Admin
                  </Link>
                ) : null}
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    <LogOutIcon />
                    Keluar
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    <UserIcon />
                    Masuk
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
