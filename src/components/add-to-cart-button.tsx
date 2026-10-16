"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AddToCartButton({ variantId }: { variantId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!variantId) return;
    setPending(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      // Belum login -> arahkan ke halaman masuk, lalu balik ke produk ini.
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menambahkan ke keranjang");
        return;
      }

      toast.success("Ditambahkan ke keranjang");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      disabled={!variantId || pending}
      onClick={handleClick}
    >
      <ShoppingCartIcon />
      {pending ? "Menambahkan..." : "Tambah ke Keranjang"}
    </Button>
  );
}
