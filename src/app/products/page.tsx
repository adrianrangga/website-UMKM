import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { PackageOpenIcon, SearchIcon } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCardData } from "@/lib/products";
import { cn } from "@/lib/utils";
import { productSearchParamsSchema } from "@/lib/validators";

export const metadata: Metadata = { title: "Katalog Produk" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const SORT_LABELS = {
  terbaru: "Terbaru",
  "harga-asc": "Harga terendah",
  "harga-desc": "Harga tertinggi",
} as const;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = productSearchParamsSchema.parse(await searchParams);

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { brand: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.size !== undefined) {
    where.variants = { some: { sizeEur: filters.size } };
  }
  if (filters.min !== undefined || filters.max !== undefined) {
    where.basePrice = { gte: filters.min, lte: filters.max };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "harga-asc"
      ? { basePrice: "asc" }
      : filters.sort === "harga-desc"
        ? { basePrice: "desc" }
        : { createdAt: "desc" };

  const [total, products, categories, sizes] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: productCardInclude,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.variant.findMany({
      distinct: ["sizeEur"],
      orderBy: { sizeEur: "asc" },
      select: { sizeEur: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const data = products.map(toProductCardData);

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    if (filters.size !== undefined) params.set("size", String(filters.size));
    if (filters.min !== undefined) params.set("min", String(filters.min));
    if (filters.max !== undefined) params.set("max", String(filters.max));
    if (filters.sort !== "terbaru") params.set("sort", filters.sort);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Katalog Produk
        </h1>
        <p className="text-sm text-muted-foreground">{total} produk ditemukan</p>
      </header>

      <form
        method="get"
        action="/products"
        className="mb-8 grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="q">Cari produk</Label>
          <Input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Nama atau brand sepatu..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
            className={selectClass}
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="size">Ukuran (EUR)</Label>
          <select
            id="size"
            name="size"
            defaultValue={filters.size !== undefined ? String(filters.size) : ""}
            className={selectClass}
          >
            <option value="">Semua ukuran</option>
            {sizes.map((size) => (
              <option key={size.sizeEur} value={size.sizeEur}>
                {size.sizeEur}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sort">Urutkan</Label>
          <select
            id="sort"
            name="sort"
            defaultValue={filters.sort}
            className={selectClass}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="min">Harga minimum (Rp)</Label>
          <Input
            id="min"
            name="min"
            inputMode="numeric"
            defaultValue={filters.min ?? ""}
            placeholder="cth. 200000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max">Harga maksimum (Rp)</Label>
          <Input
            id="max"
            name="max"
            inputMode="numeric"
            defaultValue={filters.max ?? ""}
            placeholder="cth. 1000000"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            <SearchIcon />
            Terapkan
          </Button>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Reset
          </Link>
        </div>
      </form>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageOpenIcon className="size-10 text-muted-foreground" />
          <p className="font-heading text-lg font-medium">
            Produk tidak ditemukan
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Coba ubah kata kunci atau filter kamu.
          </p>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Hapus semua filter
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex items-center justify-center gap-3"
              aria-label="Navigasi halaman"
            >
              <Link
                href={buildHref(filters.page - 1)}
                aria-disabled={filters.page <= 1}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  filters.page <= 1 && "pointer-events-none opacity-50",
                )}
              >
                Sebelumnya
              </Link>
              <span className="text-sm text-muted-foreground">
                Halaman {filters.page} dari {totalPages}
              </span>
              <Link
                href={buildHref(filters.page + 1)}
                aria-disabled={filters.page >= totalPages}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  filters.page >= totalPages && "pointer-events-none opacity-50",
                )}
              >
                Berikutnya
              </Link>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
