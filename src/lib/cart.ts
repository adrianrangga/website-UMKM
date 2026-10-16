import { prisma } from "@/lib/prisma";

export const SHIPPING_COST = 20000;
export const FREE_SHIPPING_MIN = 500000;

export function shippingCostFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
}

export type CartLine = {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantId: string;
  sizeEur: number;
  sizeUs: number;
  color: string;
  stock: number;
  productName: string;
  productSlug: string;
  productBrand: string;
  imageUrl: string;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
};

/** Ambil keranjang user + harga yang selalu dihitung ulang dari database. */
export async function getCart(userId: string): Promise<CartSummary> {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    include: { variant: { include: { product: true } } },
  });

  const lines: CartLine[] = items.map((item) => {
    const unitPrice =
      item.variant.priceOverride ?? item.variant.product.basePrice;

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      variantId: item.variantId,
      sizeEur: item.variant.sizeEur,
      sizeUs: item.variant.sizeUs,
      color: item.variant.color,
      stock: item.variant.stock,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      productBrand: item.variant.product.brand,
      imageUrl: item.variant.product.imageUrl,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const shippingCost = shippingCostFor(subtotal);

  return {
    lines,
    itemCount,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
}
