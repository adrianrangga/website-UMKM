import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Daftar" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/");

  const { next } = await searchParams;
  const target = typeof next === "string" ? next : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-16 sm:px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Buat akun SoleMate</CardTitle>
          <CardDescription>
            Password minimal 8 karakter. Akun baru otomatis sebagai pembeli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" next={target} />
        </CardContent>
      </Card>
    </div>
  );
}
