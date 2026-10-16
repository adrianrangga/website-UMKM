import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  className,
}: {
  price: number;
  className?: string;
}) {
  return (
    <span className={cn("font-heading font-semibold", className)}>
      {formatRupiah(price)}
    </span>
  );
}
