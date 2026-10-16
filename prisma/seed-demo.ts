/**
 * Seed DATA DEMO untuk mencoba grafik & laporan di panel admin.
 *
 *   npx tsx prisma/seed-demo.ts          -> buat transaksi palsu
 *   npx tsx prisma/seed-demo.ts --hapus  -> hapus semua transaksi palsu
 *
 * Setiap order diberi note "demo-seed" sebagai penanda. Stok varian TIDAK
 * diubah supaya katalog tetap utuh.
 */
import { PrismaClient, type OrderStatus, type PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "demo-seed";

const RECIPIENT = "Budi Santoso";
const PHONE = "081234567890";
const ADDRESS = "Jl. Merdeka No. 10, Bandung, Jawa Barat 40115";

const PAID_LIKE: OrderStatus[] = ["PAID", "SHIPPED", "COMPLETED"];

const PAYMENT_STATUS: Record<OrderStatus, PaymentStatus> = {
  PENDING_PAYMENT: "PENDING",
  PAID: "PAID",
  SHIPPED: "PAID",
  COMPLETED: "PAID",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

const PAYMENT_TYPES = ["credit_card", "bank_transfer", "gopay", "qris", "cstore"];

// Bobot status biar terlihat realistis.
const STATUS_WEIGHTS: [OrderStatus, number][] = [
  ["PAID", 45],
  ["COMPLETED", 25],
  ["SHIPPED", 12],
  ["PENDING_PAYMENT", 8],
  ["CANCELLED", 5],
  ["EXPIRED", 5],
];

function pickStatus() {
  const total = STATUS_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [status, weight] of STATUS_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return status;
  }
  return "PAID" as OrderStatus;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tanggalAcak(hariKeBelakang: number) {
  const date = new Date();
  date.setDate(date.getDate() - hariKeBelakang);
  date.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function nomorOrder(date: Date, urutan: number) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-D${String(urutan).padStart(3, "0")}`;
}

async function hapusDemo() {
  const hasil = await prisma.order.deleteMany({ where: { note: TAG } });
  console.log(`Dihapus ${hasil.count} order demo (item & pembayaran ikut terhapus).`);
}

async function main() {
  const customer = await prisma.user.findUniqueOrThrow({
    where: { email: "user@solemate.test" },
  });

  const variants = await prisma.variant.findMany({
    include: { product: { select: { name: true, basePrice: true } } },
  });
  if (variants.length === 0) throw new Error("Belum ada varian — jalankan `npx prisma db seed` dulu.");

  // Bersihkan dulu supaya aman dijalankan berkali-kali.
  await hapusDemo();

  // 40 order tersebar 21 hari ke belakang; hari-hari terakhir lebih padat
  // supaya grafik 7 hari terlihat berisi.
  const rencana: number[] = [];
  for (let i = 0; i < 40; i++) {
    const roll = Math.random();
    const hari = roll < 0.7 ? randomInt(0, 6) : randomInt(7, 20);
    rencana.push(hari);
  }
  rencana.sort((a, b) => b - a);

  const urutanPerHari = new Map<string, number>();
  let dibuat = 0;
  let totalPendapatan = 0;

  for (const hari of rencana) {
    const createdAt = tanggalAcak(hari);
    const kunciHari = createdAt.toDateString();
    const urutan = (urutanPerHari.get(kunciHari) ?? 0) + 1;
    urutanPerHari.set(kunciHari, urutan);

    const jumlahItem = randomInt(1, 3);
    const dipakai = new Set<string>();
    const items: {
      variantId: string;
      productName: string;
      variantLabel: string;
      unitPrice: number;
      quantity: number;
    }[] = [];

    let subtotal = 0;
    for (let i = 0; i < jumlahItem; i++) {
      const variant = pick(variants);
      if (dipakai.has(variant.id)) continue;
      dipakai.add(variant.id);

      const quantity = randomInt(1, 2);
      const unitPrice = variant.priceOverride ?? variant.product.basePrice;
      subtotal += unitPrice * quantity;

      items.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: `EUR ${variant.sizeEur} / ${variant.color}`,
        unitPrice,
        quantity,
      });
    }

    const shippingCost = subtotal >= 500000 ? 0 : 20000;
    const total = subtotal + shippingCost;
    const status = pickStatus();
    const paidAt = PAID_LIKE.includes(status)
      ? new Date(createdAt.getTime() + randomInt(1, 30) * 60000)
      : null;

    await prisma.order.create({
      data: {
        orderNumber: nomorOrder(createdAt, urutan),
        userId: customer.id,
        status,
        subtotal,
        shippingCost,
        total,
        shippingRecipient: RECIPIENT,
        shippingPhone: PHONE,
        shippingAddress: ADDRESS,
        note: TAG,
        createdAt,
        paidAt,
        items: { create: items },
        payment: {
          create: {
            midtransOrderId: `DEMO-${createdAt.getTime()}-${urutan}`,
            grossAmount: total,
            status: PAYMENT_STATUS[status],
            paymentType: pick(PAYMENT_TYPES),
          },
        },
      },
    });

    if (PAID_LIKE.includes(status)) totalPendapatan += total;
    dibuat += 1;
  }

  console.log(`Dibuat ${dibuat} order demo.`);
  console.log(`Total pendapatan (lunas) ± Rp ${totalPendapatan.toLocaleString("id-ID")}`);
  console.log(`Hapus lagi dengan: npx tsx prisma/seed-demo.ts --hapus`);
}

if (process.argv.includes("--hapus")) {
  hapusDemo()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
} else {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
