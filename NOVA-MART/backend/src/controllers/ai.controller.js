import { asyncHandler } from '../lib/asyncHandler.js';
import { ok } from '../lib/respond.js';
import {
  generateWithFallback,
  buildProductDescriptionPrompt,
  buildSearchAssistPrompt,
  buildProductRecommendationsPrompt,
} from '../lib/ai.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';

export const generateProductDescription = asyncHandler(async (req, res) => {
  const { name, brand, category, price, comparePrice, existingDescription } = req.body;

  if (!name?.trim()) throw ApiError.badRequest('Product name is required');
  if (!brand?.trim()) throw ApiError.badRequest('Brand is required');
  if (!category?.trim()) throw ApiError.badRequest('Category is required');
  if (!price) throw ApiError.badRequest('Price is required');

  const prompt = buildProductDescriptionPrompt({
    name,
    brand,
    category,
    price,
    comparePrice,
    existingDescription,
  });

  try {
    const description = await generateWithFallback(prompt);
    ok(res, { description });
  } catch (err) {
    console.error('[AI] Product description generation failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const assistSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query?.trim()) throw ApiError.badRequest('Search query is required');

  const [categories, products] = await Promise.all([
    prisma.product.findMany({ select: { category: true }, distinct: ['category'] }),
    prisma.product.findMany({ select: { name: true, category: true }, take: 100 }),
  ]);

  const uniqueCategories = [...new Set(categories.map(c => c.category))];

  const prompt = buildSearchAssistPrompt({
    query,
    categories: uniqueCategories,
    products,
  });

  try {
    const text = await generateWithFallback(prompt);
    let suggestions = [];
    try {
      suggestions = JSON.parse(text);
      if (!Array.isArray(suggestions)) throw new Error('Not an array');
    } catch {
      throw new Error('Invalid AI response format');
    }
    ok(res, { suggestions });
  } catch (err) {
    console.error('[AI] Search assist failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const recommendProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [userPurchases, userWishlist, allProducts] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { userId, status: { in: ['DELIVERED', 'SHIPPED'] } } },
      select: { productName: true, product: { select: { category: true } } },
      take: 20,
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { select: { name: true, category: true } } },
      take: 20,
    }),
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      select: { id: true, name: true, category: true, price: true },
      take: 100,
    }),
  ]);

  const purchases = userPurchases.map(item => ({
    productName: item.productName,
    category: item.product?.category,
  }));

  const wishlist = userWishlist.map(item => ({
    name: item.product?.name,
    category: item.product?.category,
  }));

  const prompt = buildProductRecommendationsPrompt({
    userPurchases: purchases,
    userWishlist: wishlist,
    allProducts,
  });

  try {
    const text = await generateWithFallback(prompt);
    let recommendations = [];
    try {
      recommendations = JSON.parse(text);
      if (!Array.isArray(recommendations)) throw new Error('Not an array');
    } catch {
      throw new Error('Invalid AI response format');
    }

    // Fetch full product details for recommended IDs
    const productIds = recommendations.map(r => r.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, stock: { gt: 0 } },
      select: { id: true, name: true, slug: true, price: true, image: true, category: true, brand: true },
    });

    const enriched = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return product ? { ...product, reason: rec.reason } : null;
    }).filter(Boolean);

    ok(res, { recommendations: enriched });
  } catch (err) {
    console.error('[AI] Product recommendations failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});