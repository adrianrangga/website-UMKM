"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan profil");
        return;
      }

      toast.success("Profil disimpan");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled />
        <span className="text-xs text-muted-foreground">
          Email tidak bisa diubah.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">No. telepon</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="08xxxxxxxxxx"
        />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan profil"}
        </Button>
      </div>
    </form>
  );
}
