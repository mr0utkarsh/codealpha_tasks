import { ApiError } from '../lib/ApiError.js';
import { getShippingPolicy } from '../config/constants.js';
import { prisma } from '../lib/prisma.js';
import { serializeProduct } from '../utils/serialize.js';
import { slugify } from '../utils/slug.js';

/**
 * Sort keys accepted by the products endpoint. `relevance` is the storefront
 * default: featured items first, then the best rated.
 */
const SORT_MAP = {
  relevance: [{ isFeatured: 'desc' }, { rating: 'desc' }, { reviewCount: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  rating: [{ rating: 'desc' }, { reviewCount: 'desc' }],
  popularity: [{ reviewCount: 'desc' }, { rating: 'desc' }],
  'name-asc': [{ name: 'asc' }],
  'name-desc': [{ name: 'desc' }],
};

function buildWhere(filters) {
  const conditions = [];

  if (filters.search) {
    conditions.push({
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.ids?.length) {
    conditions.push({ id: { in: filters.ids } });
  }

  if (filters.category) {
    conditions.push({ category: { equals: filters.category, mode: 'insensitive' } });
  }

  if (filters.brand) {
    conditions.push({ brand: { equals: filters.brand, mode: 'insensitive' } });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    conditions.push({
      price: {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      },
    });
  }

  if (filters.inStock === true) conditions.push({ stock: { gt: 0 } });
  if (filters.inStock === false) conditions.push({ stock: { lte: 0 } });
  if (filters.featured) conditions.push({ isFeatured: true });
  if (filters.trending) conditions.push({ isTrending: true });

  return conditions.length ? { AND: conditions } : {};
}

/**
 * Paginated, filterable product list.
 *
 * @param {object} filters
 */
export async function listProducts(filters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const where = buildWhere(filters);

  const [total, records] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: SORT_MAP[filters.sort] ?? SORT_MAP.relevance,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: records.map(serializeProduct),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Finds a product by cuid or slug.
 *
 * @param {string} idOrSlug
 */
export function findProduct(idOrSlug) {
  return prisma.product.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
}

/**
 * @param {string} idOrSlug
 */
export async function getProductDetail(idOrSlug) {
  const product = await findProduct(idOrSlug);
  if (!product) throw ApiError.notFound('That product is no longer available.');

  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    take: 4,
  });

  return {
    product: serializeProduct(product),
    related: related.map(serializeProduct),
  };
}

/**
 * Category roll-up used by the storefront navigation and the "browse by
 * category" section.
 */
export async function listCategories() {
  const [grouped, representatives] = await Promise.all([
    prisma.product.groupBy({
      by: ['category'],
      _count: { _all: true },
      _min: { price: true },
      _avg: { rating: true },
    }),
    prisma.product.findMany({
      select: { category: true, name: true, slug: true, image: true },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    }),
  ]);

  const previewByCategory = new Map();
  for (const item of representatives) {
    if (!previewByCategory.has(item.category)) previewByCategory.set(item.category, item);
  }

  return grouped
    .map((group) => {
      const preview = previewByCategory.get(group.category);
      return {
        name: group.category,
        productCount: group._count._all,
        averageRating: Number((group._avg.rating ?? 0).toFixed(2)),
        startingPrice: group._min.price === null ? null : Number(group._min.price),
        image: preview?.image ?? null,
        previewProduct: preview ? { name: preview.name, slug: preview.slug } : null,
      };
    })
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));
}

/**
 * Headline numbers for the storefront (trust strip / footer badges).
 */
export async function getCatalogSummary() {
  const [productCount, categoryCount, brandCount, aggregates] = await Promise.all([
    prisma.product.count(),
    prisma.product.groupBy({ by: ['category'], _count: { _all: true } }),
    prisma.product.groupBy({ by: ['brand'], _count: { _all: true } }),
    prisma.product.aggregate({ _avg: { rating: true }, _sum: { reviewCount: true } }),
  ]);

  const { freeShippingThreshold, shippingFee } = getShippingPolicy();

  return {
    productCount,
    categoryCount: categoryCount.length,
    brandCount: brandCount.length,
    averageRating: Number((aggregates._avg.rating ?? 0).toFixed(2)),
    reviewCount: aggregates._sum.reviewCount ?? 0,
    freeShippingThreshold,
    shippingFee,
    currency: 'USD',
  };
}

/**
 * Admin-only catalogue management. Images default to the primary `image`.
 */
function normalizeImages(input) {
  const images = (input.images ?? []).filter(Boolean);
  const primary = input.image ?? images[0];
  const gallery = images.length ? images : [primary];
  const unique = [...new Set([primary, ...gallery].filter(Boolean))];
  return { image: unique[0], images: unique };
}

async function assertSlugIsFree(slug, ignoreId) {
  const existing = await prisma.product.findFirst({
    where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict(`The slug "${slug}" is already used by another product.`);
}

/**
 * @param {object} input validated `createProductSchema` payload
 */
export async function createProduct(input) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  await assertSlugIsFree(slug);

  const { image, images } = normalizeImages(input);
  const record = await prisma.product.create({
    data: { ...input, slug, image, images },
  });

  return serializeProduct(record);
}

/**
 * @param {string} id
 * @param {object} input validated `updateProductSchema` payload
 */
export async function updateProduct(id, input) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound('That product no longer exists.');

  const data = { ...input };

  if (input.slug) {
    data.slug = slugify(input.slug);
    await assertSlugIsFree(data.slug, id);
  }

  if (input.image || input.images) {
    const merged = normalizeImages({
      image: input.image ?? undefined,
      images: input.images ?? undefined,
    });
    data.image = merged.image;
    data.images = merged.images;
  }

  const record = await prisma.product.update({ where: { id }, data });
  return serializeProduct(record);
}

/**
 * Removes a product. Products that already appear in orders are kept for
 * history integrity - the order item relation is `onDelete: Restrict`.
 *
 * @param {string} id
 */
export async function deleteProduct(id) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound('That product no longer exists.');

  const orderReference = await prisma.orderItem.findFirst({ where: { productId: id }, select: { id: true } });
  if (orderReference) {
    throw ApiError.conflict(
      'This product appears in existing orders, so it cannot be deleted. Set its stock to 0 instead to hide it from sale.'
    );
  }

  await prisma.product.delete({ where: { id } });
  return { id, deleted: true };
}

export const __testing = { buildWhere, SORT_MAP };

