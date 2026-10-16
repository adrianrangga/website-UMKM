import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <SearchXIcon className="size-12 text-muted-foreground" />
      <h1 className="font-heading text-2xl font-semibold">
        Halaman tidak ditemukan
      </h1>
      <p className="max-w-md text-muted-foreground">
        Produk atau halaman yang kamu cari tidak tersedia. Mungkin sudah dihapus
        atau tautannya salah.
      </p>
      <Link href="/products" className={cn(buttonVariants())}>
        Lihat katalog
      </Link>
    </div>
  );
}
