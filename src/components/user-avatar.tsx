import Image from "next/image";

import { cn } from "@/lib/utils";

/** Foto profil bulat; jatuh ke inisial nama bila belum ada foto. */
export function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`Foto profil ${name}`}
        width={96}
        height={96}
        unoptimized
        className={cn(
          "rounded-full object-cover ring-1 ring-foreground/10",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-full bg-primary/10 font-semibold text-primary",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
