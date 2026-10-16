import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { VariantCreateForm } from "@/components/variant-create-form";
import { VariantStockList } from "@/components/variant-stock-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: [{ color: "asc" }, { sizeEur: "asc" }] },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          Produk
        </Link>
        <span className="mx-1.5" aria-hidden>
          /
        </span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Detail Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              articleCode: product.articleCode,
              brand: product.brand,
              description: product.description,
              basePrice: product.basePrice,
              categoryId: product.categoryId,
              imageUrl: product.imageUrl,
              isActive: product.isActive,
            }}
            categories={categories}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Stok Varian{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (total {totalStock})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <VariantStockList
            variants={product.variants.map((variant) => ({
              id: variant.id,
              sizeEur: variant.sizeEur,
              sizeUs: variant.sizeUs,
              color: variant.color,
              sku: variant.sku,
              stock: variant.stock,
            }))}
          />
          <VariantCreateForm productId={product.id} />
        </CardContent>
      </Card>
    </div>
  );
}
