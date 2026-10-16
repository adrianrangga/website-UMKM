import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, PackageOpenIcon } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCardData } from "@/lib/products";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Marketplace sepatu SoleMate: sneakers, running, formal, dan sandal dengan pilihan ukuran serta harga dalam Rupiah.",
};

export const dynamic = "force-dynamic";

const LATEST_LIMIT = 8;

async function CategoryGrid() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/products?category=${category.slug}`}
          className="group rounded-xl border p-4 transition-colors hover:border-primary hover:bg-primary/5"
        >
          <p className="font-heading font-medium group-hover:text-primary">
            {category.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {category._count.products} produk
          </p>
        </Link>
      ))}
    </div>
  );
}

async function LatestProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: LATEST_LIMIT,
    include: productCardInclude,
  });

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <PackageOpenIcon className="size-10 text-muted-foreground" />
        <p className="font-heading text-lg font-medium">Belum ada produk</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Katalog masih kosong. Jalankan{" "}
          <code className="rounded bg-muted px-1 py-0.5">npx prisma db seed</code>{" "}
          untuk mengisi data contoh.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={toProductCardData(product)} />
      ))}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: LATEST_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        >
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border bg-muted/40 px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-sm font-medium text-primary">
          Marketplace sepatu lokal by Adrian Rangga Pandita
        </p>
        <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Sepatu yang pas, harga yang jelas.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Sneakers, running, formal, dan sandal — pilih ukuran serta warnamu,
          semua harga ditampilkan dalam Rupiah.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/products" className={cn(buttonVariants({ size: "lg" }))}>
            Jelajahi katalog
            <ArrowRightIcon />
          </Link>
          <Link
            href="/#kategori"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Lihat kategori
          </Link>
        </div>
      </section>

      <section id="kategori" className="mt-12 scroll-mt-24">
        <h2 className="mb-4 font-heading text-xl font-semibold">Kategori</h2>
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryGrid />
        </Suspense>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold">
            Produk Terbaru
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <LatestProducts />
        </Suspense>
      </section>
    </div>
  );
}
