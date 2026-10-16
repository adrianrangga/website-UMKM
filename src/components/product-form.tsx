"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteButton } from "@/components/delete-button";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormValues = {
  id: string;
  name: string;
  slug: string;
  articleCode: string;
  brand: string;
  description: string;
  basePrice: number;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [pending, setPending] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [values, setValues] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    articleCode: product?.articleCode ?? "",
    brand: product?.brand ?? "",
    description: product?.description ?? "",
    basePrice: product ? String(product.basePrice) : "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    imageUrl: product?.imageUrl ?? "/placeholder-shoe.svg",
    isActive: product?.isActive ?? true,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const payload = {
      name: values.name,
      brand: values.brand,
      description: values.description,
      basePrice: Number(values.basePrice),
      categoryId: values.categoryId,
      imageUrl: values.imageUrl,
      isActive: values.isActive,
      ...(isEdit ? {} : { slug: values.slug, articleCode: values.articleCode }),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/products/${product?.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        product?: { id: string };
      };

      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan produk");
        return;
      }

      toast.success(isEdit ? "Produk disimpan" : "Produk dibuat");

      if (!isEdit && data.product) {
        router.push(`/admin/products/${data.product.id}`);
      }
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
        <Label htmlFor="name">Nama produk</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => {
            const name = event.target.value;
            setValues((prev) => ({
              ...prev,
              name,
              slug: slugTouched ? prev.slug : slugify(name),
            }));
          }}
          required
        />
      </div>

      {isEdit ? (
        <p className="text-xs text-muted-foreground">
          Slug: <code>{values.slug}</code> · Kode artikel:{" "}
          <code>{values.articleCode}</code> (tidak bisa diubah)
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug URL</Label>
            <Input
              id="slug"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setValues((prev) => ({ ...prev, slug: event.target.value }));
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="articleCode">Kode artikel</Label>
            <Input
              id="articleCode"
              value={values.articleCode}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  articleCode: event.target.value,
                }))
              }
              placeholder="cth. SM-XX-013"
              required
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={values.brand}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, brand: event.target.value }))
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basePrice">Harga dasar (Rp)</Label>
          <Input
            id="basePrice"
            inputMode="numeric"
            value={values.basePrice}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, basePrice: event.target.value }))
            }
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Kategori</Label>
        <select
          id="categoryId"
          value={values.categoryId}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, categoryId: event.target.value }))
          }
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <ImageUploadField
        value={values.imageUrl}
        onChange={(imageUrl) =>
          setValues((prev) => ({ ...prev, imageUrl }))
        }
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, description: event.target.value }))
          }
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, isActive: event.target.checked }))
          }
          className="size-4 accent-[var(--primary)]"
        />
        Tampilkan di katalog (aktif)
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : isEdit ? "Simpan produk" : "Buat produk"}
        </Button>
        {isEdit && product ? (
          <DeleteButton
            url={`/api/admin/products/${product.id}`}
            confirmText={`Hapus produk "${product.name}" beserta semua variannya?`}
            label="Hapus produk"
            redirectTo="/admin/products"
          />
        ) : null}
      </div>
    </form>
  );
}
