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

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
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
          <CardTitle className="text-xl">Masuk ke SoleMate</CardTitle>
          <CardDescription>Gunakan email dan password akunmu.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" next={target} />
        </CardContent>
      </Card>
    </div>
  );
}
