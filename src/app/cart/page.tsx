import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartView } from "@/components/cart-view";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/cart";

export const metadata: Metadata = { title: "Keranjang" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/cart");
  if (session.role !== "CUSTOMER") redirect("/");

  const cart = await getCart(session.sub);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">
        Keranjang
      </h1>
      <CartView initialCart={cart} />
    </div>
  );
}
