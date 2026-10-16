"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPending(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Gagal mengunggah gambar");
        return;
      }

      onChange(data.url);
      toast.success("Gambar diunggah");
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="imageUrl">Gambar produk</Label>

      <div className="flex items-start gap-4">
        {value ? (
          <Image
            src={value}
            alt="Pratinjau gambar produk"
            width={160}
            height={160}
            unoptimized
            className="size-20 rounded-lg bg-muted object-contain p-2"
          />
        ) : (
          <div className="grid size-20 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
            Kosong
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <Input
            id="imageUrl"
            value={value}
            placeholder="/placeholder-shoe.svg"
            onChange={(event) => onChange(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon />
              {pending ? "Mengunggah..." : "Unggah gambar"}
            </Button>
            <span className="text-xs text-muted-foreground">
              PNG/JPG/WebP, maks 2 MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
