import Image from "next/image";
import Link from "next/link";

import { PriceTag } from "@/components/price-tag";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  categoryName: string;
  minPrice: number;
  totalStock: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.totalStock <= 0;
  const lowStock = !soldOut && product.totalStock <= 3;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group/cardlink block h-full rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-shadow group-hover/cardlink:shadow-md group-hover/cardlink:ring-primary/40">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={600}
          unoptimized
          className="aspect-square w-full bg-muted object-contain p-6"
        />
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{product.categoryName}</Badge>
            {soldOut ? (
              <Badge variant="destructive">Stok habis</Badge>
            ) : lowStock ? (
              <Badge variant="outline">Stok terbatas</Badge>
            ) : null}
          </div>
          <CardTitle className="line-clamp-2">{product.name}</CardTitle>
          <CardDescription>{product.brand}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Harga mulai</span>
          <PriceTag price={product.minPrice} className="text-lg" />
        </CardContent>
      </Card>
    </Link>
  );
}
