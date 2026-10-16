import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AddressManager } from "@/components/address-manager";
import { AvatarUpload } from "@/components/avatar-upload";
import { DeleteAccountCard } from "@/components/delete-account-card";
import { ProfileForm } from "@/components/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Akun Saya" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  if (session.role !== "CUSTOMER") redirect("/");

  const [user, addresses] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.sub },
      select: { name: true, email: true, phone: true, avatarUrl: true },
    }),
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">
        Akun Saya
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Perbarui foto, nama, dan nomor teleponmu.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <AvatarUpload name={user.name} currentUrl={user.avatarUrl} />
            <Separator />
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Alamat Pengiriman</CardTitle>
            <CardDescription>
              Alamat ini dipakai saat checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressManager addresses={addresses} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <DeleteAccountCard />
      </div>
    </div>
  );
}
