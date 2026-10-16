"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DeleteAccountCard() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function hapusAkun() {
    const setuju = window.confirm(
      "Hapus akun ini secara PERMANEN?\n\nFoto profil, alamat, dan keranjang akan hilang dan tidak bisa dikembalikan.",
    );
    if (!setuju) return;

    setPending(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menghapus akun");
        return;
      }

      toast.success("Akun kamu sudah dihapus");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Hapus Akun</CardTitle>
        <CardDescription>
          Menghapus akun beserta foto profil, alamat, dan keranjang secara
          permanen. Tindakan ini tidak bisa dibatalkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Riwayat pesanan tidak ikut terhapus karena merupakan catatan transaksi
          toko. Akun yang sudah punya riwayat pesanan tidak bisa dihapus —
          hubungi admin bila perlu.
        </p>
        <div>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={hapusAkun}
          >
            <Trash2Icon />
            {pending ? "Menghapus akun..." : "Hapus akun permanen"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
