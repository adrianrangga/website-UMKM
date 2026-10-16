import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutForm, type AddressOption } from "@/components/checkout-form";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/checkout");
  if (session.role !== "CUSTOMER") redirect("/");

  const [cart, addresses] = await Promise.all([
    getCart(session.sub),
    prisma.address.findMany({
      where: { userId: session.sub },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      select: {
        id: true,
        recipient: true,
        phone: true,
        street: true,
        city: true,
        province: true,
        postalCode: true,
        isDefault: true,
      },
    }),
  ]);

  if (cart.lines.length === 0) redirect("/cart");

  const addressOptions: AddressOption[] = addresses;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">
        Checkout
      </h1>
      <CheckoutForm cart={cart} addresses={addressOptions} />
    </div>
  );
}
