/**
 * Seed script - `npm run db:seed` (or `npx prisma db seed`).
 *
 * Provides:
 *   * 53 products across 10 categories, with verified remote imagery
 *   * a customer account (demo@novamart.com) and an admin account
 *   * pre-filled cart, wishlist and order history for the demo customer
 *
 * The script is idempotent: products and users are upserted, while the demo
 * customer's cart / wishlist / orders are rebuilt on every run.
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import {
  assertSeedIntegrity,
  demoCart,
  demoOrders,
  demoShippingAddress,
  demoUsers,
  demoWishlist,
  products,
} from './data/index.js';
import { calculateShipping } from '../src/config/constants.js';
import { fromCents, toCents } from '../src/utils/money.js';
import { generateOrderNumber } from '../src/utils/orderNumber.js';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

const logger = {
  step: (message) => console.log(`\u2192 ${message}`),
  done: (message) => console.log(`  \u2713 ${message}`),
};

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 24, 0, 0);
  return date;
}

async function seedUsers() {
  const users = [];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password: passwordHash, phone: user.phone, role: user.role },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        phone: user.phone,
        role: user.role,
      },
    });
    users.push(record);
  }

  return users;
}

async function seedProducts() {
  const stored = [];

  for (const product of products) {
    const record = await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product },
      create: { ...product },
    });
    stored.push(record);
  }

  return stored;
}

async function seedDemoActivity(customer, catalogue) {
  const bySlug = new Map(catalogue.map((product) => [product.slug, product]));

  // Cart -------------------------------------------------------------------
  await prisma.cartItem.deleteMany({ where: { userId: customer.id } });
  for (const item of demoCart) {
    const product = bySlug.get(item.slug);
    if (!product) continue;
    await prisma.cartItem.create({
      data: { userId: customer.id, productId: product.id, quantity: item.quantity },
    });
  }

  // Wishlist ---------------------------------------------------------------
  await prisma.wishlistItem.deleteMany({ where: { userId: customer.id } });
  for (const slug of demoWishlist) {
    const product = bySlug.get(slug);
    if (!product) continue;
    await prisma.wishlistItem.create({
      data: { userId: customer.id, productId: product.id },
    });
  }

  // Orders -----------------------------------------------------------------
  await prisma.order.deleteMany({ where: { userId: customer.id } });

  for (const order of demoOrders) {
    const lines = order.items
      .map((item) => ({ ...item, product: bySlug.get(item.slug) }))
      .filter((line) => Boolean(line.product));

    const subtotalCents = lines.reduce(
      (total, line) => total + toCents(line.product.price) * line.quantity,
      0
    );
    const { shippingFeeCents, totalCents } = calculateShipping(subtotalCents);
    const createdAt = daysAgo(order.daysAgo);

    await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(createdAt),
        userId: customer.id,
        subtotal: fromCents(subtotalCents),
        shippingFee: fromCents(shippingFeeCents),
        totalAmount: fromCents(totalCents),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt,
        updatedAt: createdAt,
        ...demoShippingAddress,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            productName: line.product.name,
            productImage: line.product.image,
            quantity: line.quantity,
            price: line.product.price,
          })),
        },
      },
    });
  }
}

function printSummary({ productCount, categoryCount, userCount, orderCount }) {
  console.log('\n---------------------------------------------');
  console.log('  NOVA MART - seed complete');
  console.log('---------------------------------------------');
  console.log(`  Products          ${productCount}`);
  console.log(`  Categories        ${categoryCount}`);
  console.log(`  Accounts          ${userCount}`);
  console.log(`  Demo orders       ${orderCount}`);
  console.log('---------------------------------------------');
  console.log('  Sign in with:');
  for (const user of demoUsers) {
    console.log(`    ${user.role.padEnd(5)}  ${user.email}  /  ${user.password}`);
  }
  console.log('---------------------------------------------\n');
}

async function main() {
  const integrity = assertSeedIntegrity();
  logger.done(`Seed data validated (${integrity.productCount} products)`);

  logger.step('Creating accounts...');
  const users = await seedUsers();
  logger.done(`${users.length} accounts ready`);

  logger.step('Upserting products...');
  const catalogue = await seedProducts();
  logger.done(`${catalogue.length} products ready`);

  logger.step('Rebuilding demo cart, wishlist and order history...');
  const customer = users.find((user) => user.email === demoUsers[0].email);
  await seedDemoActivity(customer, catalogue);
  logger.done(
    `${demoOrders.length} orders, ${demoCart.length} cart items, ${demoWishlist.length} wishlist items`
  );

  printSummary({
    productCount: catalogue.length,
    categoryCount: integrity.categoryCount,
    userCount: users.length,
    orderCount: demoOrders.length,
  });
}

main()
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

