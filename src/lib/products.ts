import { Prisma } from "@prisma/client";

import type { ProductCardData } from "@/components/product-card";

// Include standar untuk kartu produk (kategori + data harga/stok varian).
export const productCardInclude = {
  category: { select: { name: true } },
  variants: { select: { stock: true, priceOverride: true } },
} satisfies Prisma.ProductInclude;

type ProductWithCardData = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

export function toProductCardData(
  product: ProductWithCardData,
): ProductCardData {
  const prices = product.variants.map(
    (variant) => variant.priceOverride ?? product.basePrice,
  );

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    categoryName: product.category.name,
    minPrice: prices.length > 0 ? Math.min(...prices) : product.basePrice,
    totalStock: product.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    ),
  };
}
