import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Perkiraan konversi EUR -> US (pria), hanya untuk data contoh.
const EUR_TO_US: Record<number, number> = {
  38: 6,
  39: 6.5,
  40: 7,
  41: 8,
  42: 8.5,
  43: 9.5,
  44: 10,
  45: 11,
};

// Stok bervariasi, sengaja memuat 0 dan 1-2 untuk menguji stok habis.
const STOCK_PATTERN = [3, 5, 0, 2, 1, 8, 4, 0, 6, 2, 1, 7, 0, 3, 2, 1];

const CATEGORIES = [
  { name: "Sneakers", slug: "sneakers" },
  { name: "Running", slug: "running" },
  { name: "Formal", slug: "formal" },
  { name: "Sandal", slug: "sandal" },
];

type ProductSeed = {
  name: string;
  slug: string;
  articleCode: string;
  brand: string;
  description: string;
  basePrice: number;
  categorySlug: string;
  colors: string[];
  sizes: number[];
};

const PRODUCTS: ProductSeed[] = [
  {
    name: "Arunika Low Classic",
    slug: "arunika-low-classic",
    articleCode: "SM-LC-001",
    brand: "Arunika",
    description:
      "Sneakers low-top serbaguna dengan upper kanvas tebal dan sol karet anti-slip. Cocok untuk aktivitas harian.",
    basePrice: 599000,
    categorySlug: "sneakers",
    colors: ["Putih", "Hitam"],
    sizes: [39, 40, 41, 42, 43],
  },
  {
    name: "Arunika Court Pro",
    slug: "arunika-court-pro",
    articleCode: "SM-CP-002",
    brand: "Arunika",
    description:
      "Sneakers bertema lapangan dengan bantalan tumit dan sirkulasi udara di bagian atas.",
    basePrice: 749000,
    categorySlug: "sneakers",
    colors: ["Putih"],
    sizes: [40, 41, 42, 43, 44],
  },
  {
    name: "Verterra Daily Canvas",
    slug: "verterra-daily-canvas",
    articleCode: "VT-DC-003",
    brand: "Verterra",
    description:
      "Sneakers kanvas ringan untuk pemakaian sehari-hari dengan tali datar dan insole empuk.",
    basePrice: 429000,
    categorySlug: "sneakers",
    colors: ["Navy", "Krem"],
    sizes: [38, 39, 40, 41],
  },
  {
    name: "Verterra Runlite 5",
    slug: "verterra-runlite-5",
    articleCode: "VT-RL-004",
    brand: "Verterra",
    description:
      "Sepatu lari ringan dengan midsole responsif dan mesh breathable untuk jarak menengah.",
    basePrice: 899000,
    categorySlug: "running",
    colors: ["Hitam", "Hijau"],
    sizes: [40, 41, 42, 43, 44],
  },
  {
    name: "NusaPace Maraton",
    slug: "nusapace-maraton",
    articleCode: "NP-MR-005",
    brand: "NusaPace",
    description:
      "Sepatu lari jarak jauh dengan drop rendah, bantalan tebal, dan outsole karbon fleksibel.",
    basePrice: 1199000,
    categorySlug: "running",
    colors: ["Abu"],
    sizes: [41, 42, 43, 44, 45],
  },
  {
    name: "NusaPace Trail Blaze",
    slug: "nusapace-trail-blaze",
    articleCode: "NP-TB-006",
    brand: "NusaPace",
    description:
      "Sepatu lari trail dengan grip kasar, pelindung toe cap, dan material tahan cipratan air.",
    basePrice: 1049000,
    categorySlug: "running",
    colors: ["Cokelat", "Hitam"],
    sizes: [40, 41, 42, 43],
  },
  {
    name: "Arunika Oxford Leather",
    slug: "arunika-oxford-leather",
    articleCode: "AR-OX-007",
    brand: "Arunika",
    description:
      "Sepatu formal oxford kulit sintetis dengan jahitan halus untuk acara resmi dan kantor.",
    basePrice: 1299000,
    categorySlug: "formal",
    colors: ["Cokelat Tua"],
    sizes: [39, 40, 41, 42, 43],
  },
  {
    name: "Verterra Derby Formal",
    slug: "verterra-derby-formal",
    articleCode: "VT-DB-008",
    brand: "Verterra",
    description:
      "Sepatu derby dengan sol tipis dan lining lembut, nyaman dipakai sepanjang hari kerja.",
    basePrice: 1099000,
    categorySlug: "formal",
    colors: ["Hitam"],
    sizes: [40, 41, 42, 43, 44],
  },
  {
    name: "Arunika Loafer Executive",
    slug: "arunika-loafer-executive",
    articleCode: "AR-LF-009",
    brand: "Arunika",
    description:
      "Loafer tanpa tali dengan detail logam minimalis, mudah dipadupadankan dengan pakaian formal.",
    basePrice: 999000,
    categorySlug: "formal",
    colors: ["Cokelat"],
    sizes: [39, 40, 41, 42, 43],
  },
  {
    name: "NusaWear Slide Comfort",
    slug: "nusawear-slide-comfort",
    articleCode: "NW-SL-010",
    brand: "NusaWear",
    description:
      "Sandal slide dengan footbed empuk dan strap lebar, pas untuk santai di rumah maupun jalan.",
    basePrice: 199000,
    categorySlug: "sandal",
    colors: ["Hitam", "Biru"],
    sizes: [39, 40, 41, 42],
  },
  {
    name: "NusaWear Trek Sandal",
    slug: "nusawear-trek-sandal",
    articleCode: "NW-TK-011",
    brand: "NusaWear",
    description:
      "Sandal trek dengan strap adjustable dan sol bergerigi untuk medan luar ruang.",
    basePrice: 349000,
    categorySlug: "sandal",
    colors: ["Hijau"],
    sizes: [40, 41, 42, 43, 44],
  },
  {
    name: "Verterra Slide Sport",
    slug: "verterra-slide-sport",
    articleCode: "VT-SS-012",
    brand: "Verterra",
    description:
      "Sandal slide sport ringan dengan bahan cepat kering, ideal setelah berolahraga.",
    basePrice: 279000,
    categorySlug: "sandal",
    colors: ["Putih", "Hitam"],
    sizes: [38, 39, 40, 41, 42],
  },
];

async function main() {
  const adminPasswordHash = bcrypt.hashSync("Admin123!", 10);
  const customerPasswordHash = bcrypt.hashSync("User123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@solemate.test" },
    update: { name: "Admin SoleMate", passwordHash: adminPasswordHash, role: Role.ADMIN },
    create: {
      name: "Admin SoleMate",
      email: "admin@solemate.test",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      phone: "081100000001",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@solemate.test" },
    update: { name: "Budi Santoso", passwordHash: customerPasswordHash, role: Role.CUSTOMER },
    create: {
      name: "Budi Santoso",
      email: "user@solemate.test",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      phone: "081100000002",
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  let variantIndex = 0;
  for (const seed of PRODUCTS) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: seed.categorySlug },
    });

    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        articleCode: seed.articleCode,
        description: seed.description,
        brand: seed.brand,
        basePrice: seed.basePrice,
        imageUrl: "/placeholder-shoe.svg",
        isActive: true,
        categoryId: category.id,
      },
      create: {
        name: seed.name,
        slug: seed.slug,
        articleCode: seed.articleCode,
        description: seed.description,
        brand: seed.brand,
        basePrice: seed.basePrice,
        imageUrl: "/placeholder-shoe.svg",
        categoryId: category.id,
      },
    });

    for (const color of seed.colors) {
      for (const sizeEur of seed.sizes) {
        const colorToken = color.toLowerCase().replace(/\s+/g, "-");
        const sku = `${seed.articleCode}-${sizeEur}-${colorToken}`;
        const stock = STOCK_PATTERN[variantIndex % STOCK_PATTERN.length];
        variantIndex += 1;

        await prisma.variant.upsert({
          where: { sku },
          update: {
            sizeUs: EUR_TO_US[sizeEur],
            color,
            stock,
          },
          create: {
            productId: product.id,
            sizeEur,
            sizeUs: EUR_TO_US[sizeEur],
            color,
            sku,
            stock,
          },
        });
      }
    }
  }

  console.log(
    `Seed selesai: ${PRODUCTS.length} produk, ${variantIndex} varian, ${CATEGORIES.length} kategori.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
