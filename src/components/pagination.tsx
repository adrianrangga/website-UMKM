import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-3"
      aria-label="Navigasi halaman"
    >
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}
      >
        Sebelumnya
      </Link>

      <span className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages}
      </span>

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}
      >
        Berikutnya
      </Link>
    </nav>
  );
}
