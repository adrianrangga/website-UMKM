import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin-nav";
import { requireAdmin, type SessionPayload } from "@/lib/auth";
import { HttpError } from "@/lib/http";

export const metadata: Metadata = { title: "Panel Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin: SessionPayload;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof HttpError) redirect("/login?next=/admin");
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Panel Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai {admin.name}
        </p>
      </div>

      <AdminNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
