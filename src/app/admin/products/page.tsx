import Link from "next/link";
import { PackageOpenIcon, PlusIcon } from "lucide-react";

import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  const pageParam = typeof page === "string" ? Number(page) : 1;
  const current = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [total, products] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        variants: { select: { stock: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{total} produk</p>
        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <PlusIcon />
          Tambah produk
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpenIcon className="size-10 text-muted-foreground" />
          <p className="font-heading text-lg font-medium">Belum ada produk</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tambahkan produk pertama, atau jalankan seed untuk data contoh.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, variant) => sum + variant.stock,
                  0,
                );

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <span className="font-medium">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {product.brand} · {product.slug}
                      </span>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{formatRupiah(product.basePrice)}</TableCell>
                    <TableCell>{totalStock}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="secondary">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        Kelola
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            page={current}
            totalPages={totalPages}
            hrefFor={(target) =>
              target > 1
                ? `/admin/products?page=${target}`
                : "/admin/products"
            }
          />
        </>
      )}
    </div>
  );
}
