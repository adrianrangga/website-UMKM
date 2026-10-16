"use client";

import { useMemo, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { cn } from "@/lib/utils";

export type VariantOption = {
  id: string;
  sizeEur: number;
  sizeUs: number;
  color: string;
  stock: number;
};

function sortBySize(list: VariantOption[]) {
  return [...list].sort((a, b) => a.sizeEur - b.sizeEur);
}

function firstPickable(list: VariantOption[]) {
  return sortBySize(list).find((variant) => variant.stock > 0) ?? list[0];
}

export function SizeSelector({ variants }: { variants: VariantOption[] }) {
  const colors = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.color))),
    [variants],
  );

  const [color, setColor] = useState(colors[0] ?? "");
  const [sizeEur, setSizeEur] = useState<number | null>(() => {
    const first = firstPickable(
      variants.filter((variant) => variant.color === colors[0]),
    );
    return first ? first.sizeEur : null;
  });

  const variantsForColor = useMemo(
    () => sortBySize(variants.filter((variant) => variant.color === color)),
    [variants, color],
  );

  const selected =
    variantsForColor.find((variant) => variant.sizeEur === sizeEur) ?? null;

  function handleColorChange(nextColor: string) {
    setColor(nextColor);
    const first = firstPickable(
      variants.filter((variant) => variant.color === nextColor),
    );
    setSizeEur(first ? first.sizeEur : null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Warna: <span className="text-muted-foreground">{color}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {colors.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleColorChange(option)}
              aria-pressed={option === color}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                option === color
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Ukuran (EUR)</span>
        <div className="flex flex-wrap gap-3">
          {variantsForColor.map((variant) => {
            const outOfStock = variant.stock <= 0;
            const isSelected = variant.sizeEur === sizeEur;

            return (
              <div key={variant.id} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSizeEur(variant.sizeEur)}
                  disabled={outOfStock}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-10 w-16 rounded-lg border text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                    outOfStock &&
                      "cursor-not-allowed border-dashed text-muted-foreground line-through opacity-60 hover:border-border",
                  )}
                >
                  {variant.sizeEur}
                </button>
                {outOfStock ? (
                  <span className="text-xs text-muted-foreground">Habis</span>
                ) : variant.stock <= 3 ? (
                  <span className="text-xs font-medium text-destructive">
                    Sisa {variant.stock}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    US {variant.sizeUs}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddToCartButton
        variantId={selected && selected.stock > 0 ? selected.id : null}
      />
    </div>
  );
}
