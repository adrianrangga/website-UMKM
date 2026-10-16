import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PriceTag } from "@/components/price-tag";
import { SizeSelector, type VariantOption } from "@/components/size-selector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { orderBy: [{ color: "asc" }, { sizeEur: "asc" }] },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Produk tidak ditemukan" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.isActive) notFound();

  const variants: VariantOption[] = product.variants.map((variant) => ({
    id: variant.id,
    sizeEur: variant.sizeEur,
    sizeUs: variant.sizeUs,
    color: variant.color,
    stock: variant.stock,
  }));

  const prices = product.variants.map(
    (variant) => variant.priceOverride ?? product.basePrice,
  );
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePrice;
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Katalog
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={600}
            height={600}
            unoptimized
            className="aspect-square w-full object-contain p-8"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.category.name}</Badge>
            {totalStock <= 0 ? (
              <Badge variant="destructive">Stok habis</Badge>
            ) : totalStock <= 3 ? (
              <Badge variant="outline">Stok terbatas</Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {product.brand} · Kode {product.articleCode}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <PriceTag price={minPrice} className="text-2xl" />
            {maxPrice > minPrice ? (
              <span className="text-sm text-muted-foreground">
                – {formatRupiah(maxPrice)}
              </span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <Separator />

          <SizeSelector variants={variants} />
        </div>
      </div>
    </div>
  );
}
