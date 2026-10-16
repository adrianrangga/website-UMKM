import { z } from "zod";

export const PRODUCT_SORTS = ["terbaru", "harga-asc", "harga-desc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

// searchParams datang dari URL (tidak dipercaya). Setiap field punya nilai
// fallback supaya input aneh tidak pernah membuat halaman error.
// Form GET mengirim field kosong sebagai "" — jangan dianggap 0.
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const productSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(100).optional().catch(undefined),
  size: z
    .preprocess(blankToUndefined, z.coerce.number().int().min(20).max(60))
    .optional()
    .catch(undefined),
  min: z
    .preprocess(blankToUndefined, z.coerce.number().int().min(0))
    .optional()
    .catch(undefined),
  max: z
    .preprocess(blankToUndefined, z.coerce.number().int().min(0))
    .optional()
    .catch(undefined),
  sort: z.enum(PRODUCT_SORTS).catch("terbaru"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export const addressSchema = z.object({
  recipient: z.string().trim().min(1, "Nama penerima wajib diisi").max(100),
  phone: z.string().trim().min(6, "Nomor telepon tidak valid").max(30),
  street: z.string().trim().min(1, "Alamat wajib diisi").max(200),
  city: z.string().trim().min(1, "Kota wajib diisi").max(100),
  province: z.string().trim().min(1, "Provinsi wajib diisi").max(100),
  postalCode: z.string().trim().min(3, "Kode pos tidak valid").max(10),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Alamat wajib dipilih"),
  note: z.string().trim().max(500).optional(),
});

export const createPaymentSchema = z.object({
  orderId: z.string().min(1),
});

export const syncPaymentSchema = z.object({
  orderId: z.string().min(1),
});

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

export const adminProductUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  brand: z.string().trim().min(1, "Brand wajib diisi").max(100),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(2000),
  basePrice: z.coerce.number().int().min(0, "Harga tidak valid").max(1000000000),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  imageUrl: z.string().trim().min(1, "Gambar wajib diisi").max(500),
  isActive: z.boolean(),
});

export const adminProductCreateSchema = adminProductUpdateSchema.extend({
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya huruf kecil, angka, dan tanda minus",
    ),
  articleCode: z.string().trim().min(1, "Kode artikel wajib diisi").max(50),
});

export const adminVariantSchema = z.object({
  stock: z.coerce.number().int().min(0, "Stok tidak valid").max(100000),
});

export const adminVariantCreateSchema = z.object({
  sizeEur: z.coerce.number().int().min(20, "Ukuran EUR tidak valid").max(60),
  sizeUs: z.coerce.number().min(1, "Ukuran US tidak valid").max(30),
  color: z.string().trim().min(1, "Warna wajib diisi").max(50),
  sku: z.string().trim().min(1, "SKU wajib diisi").max(80),
  stock: z.coerce.number().int().min(0, "Stok tidak valid").max(100000),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  phone: z.string().trim().max(30).optional(),
});

export const customerOrderActionSchema = z.object({
  action: z.enum(["cancel", "complete"]),
});

export const simulatePaymentSchema = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(["settlement", "pending", "deny", "cancel", "expire"]),
});
