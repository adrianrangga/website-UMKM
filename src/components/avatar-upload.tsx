"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, ImageIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function AvatarUpload({
  name,
  currentUrl,
}: {
  name: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const galeriRef = useRef<HTMLInputElement>(null);
  const kameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [pending, setPending] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

  async function kirim(file: File) {
    setPending(true);

    // Pratinjau lokal dulu supaya terasa langsung responsif.
    const lokal = URL.createObjectURL(file);
    setPreview(lokal);

    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as {
        avatarUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.avatarUrl) {
        toast.error(data.error ?? "Gagal mengunggah foto profil");
        setPreview(currentUrl);
        return;
      }

      setPreview(data.avatarUrl);
      toast.success("Foto profil diperbarui");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
      setPreview(currentUrl);
    } finally {
      URL.revokeObjectURL(lokal);
      setPending(false);
    }
  }

  function pilih(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void kirim(file);
    event.target.value = "";
  }

  async function hapusFoto() {
    if (!window.confirm("Hapus foto profil? Kamu bisa mengunggahnya lagi nanti.")) {
      return;
    }

    setMenghapus(true);
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menghapus foto profil");
        return;
      }

      setPreview(null);
      toast.success("Foto profil dihapus");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={name} avatarUrl={preview} className="size-20 text-2xl" />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Foto profil</span>

          <div className="flex flex-wrap gap-2">
            {/* Galeri: pemilih berkas biasa */}
            <input
              ref={galeriRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={pilih}
            />
            {/* Kamera: di ponsel membuka kamera depan; di desktop jadi pemilih berkas */}
            <input
              ref={kameraRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={pilih}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || menghapus}
              onClick={() => galeriRef.current?.click()}
            >
              <ImageIcon />
              Galeri
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || menghapus}
              onClick={() => kameraRef.current?.click()}
            >
              <CameraIcon />
              Kamera
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending || menghapus}
                onClick={hapusFoto}
              >
                <Trash2Icon />
                {menghapus ? "Menghapus..." : "Hapus foto"}
              </Button>
            ) : null}
          </div>

          <span className="text-xs text-muted-foreground">
            {pending
              ? "Mengunggah..."
              : "PNG/JPG/WebP maks 2 MB. Tombol Kamera membuka kamera di perangkat yang mendukung (ponsel/tablet); di desktop membuka pemilih berkas."}
          </span>
        </div>
      </div>
    </div>
  );
}
