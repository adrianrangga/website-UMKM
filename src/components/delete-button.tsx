"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  url,
  confirmText,
  label,
  iconOnly = false,
  redirectTo,
}: {
  url: string;
  confirmText: string;
  label?: string;
  iconOnly?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmText)) return;

    setPending(true);
    try {
      const response = await fetch(url, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }

      toast.success("Berhasil dihapus");

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size={iconOnly ? "icon-sm" : "sm"}
      aria-label={iconOnly ? "Hapus" : undefined}
      disabled={pending}
      onClick={handleClick}
    >
      <Trash2Icon />
      {iconOnly ? null : (label ?? "Hapus")}
    </Button>
  );
}
