import { env } from '../config/env.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const REQUEST_TIMEOUT_MS = 20000;

class AIError extends Error {
  constructor(message, { provider, status } = {}) {
    super(message);
    this.name = 'AIError';
    this.provider = provider;
    this.status = status;
  }
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function callGemini(prompt, apiKey) {
  const url = `${GEMINI_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1536 },
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new AIError(err.error?.message || `Gemini API error: ${res.status}`, {
      provider: 'gemini',
      status: res.status,
    });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new AIError('Empty response from Gemini', { provider: 'gemini' });
  return text;
}

async function callGroq(prompt, apiKey) {
  const body = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 1536,
  };

  const res = await fetchWithTimeout(GROQ_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new AIError(err.error?.message || `Groq API error: ${res.status}`, {
      provider: 'groq',
      status: res.status,
    });
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AIError('Empty response from Groq', { provider: 'groq' });
  return text;
}

export async function generateWithFallback(prompt) {
  const geminiKey = env.GEMINI_API_KEY;
  const groqKey = env.GROQ_API_KEY;

  if (geminiKey) {
    try {
      return await callGemini(prompt, geminiKey);
    } catch (err) {
      if (err instanceof AIError && err.status === 429) {
        console.warn('[AI] Gemini rate limited, trying Groq fallback');
      } else {
        console.warn('[AI] Gemini failed:', err.message);
      }
    }
  }

  if (groqKey) {
    try {
      return await callGroq(prompt, groqKey);
    } catch (err) {
      console.warn('[AI] Groq fallback failed:', err.message);
      throw new AIError('All AI providers unavailable', { provider: 'all' });
    }
  }

  throw new AIError('No AI provider configured', { provider: 'none' });
}

export function buildProductDescriptionPrompt({ name, brand, category, price, comparePrice, existingDescription }) {
  const base = `You are an expert e-commerce copywriter. Write a compelling product description for an online store.`;
  const details = `Product: "${name}"\nBrand: ${brand}\nCategory: ${category}\nPrice: $${price}${comparePrice ? ` (compare at $${comparePrice})` : ''}`;
  const existing = existingDescription ? `\nCurrent description: "${existingDescription}"\nImprove and expand this.` : '';
  const instruction = '\n\nWrite a persuasive product description (150-300 words) that highlights key features, benefits, and use cases. Include a compelling hook, feature highlights, and a call to action. Professional, engaging tone. No markdown.';

  return `${base}\n\n${details}${existing}${instruction}`;
}

export function buildSearchAssistPrompt({ query, categories, products }) {
  const base = `You are a shopping assistant for an e-commerce store. Help refine the user's search query.`;
  const context = `Available categories: ${categories.join(', ')}\nSample products: ${products.slice(0, 20).map(p => `${p.name} (${p.category})`).join(', ')}`;
  const instruction = `\n\nUser query: "${query}"\n\nSuggest 3-5 improved search queries that would help the user find what they're looking for. Consider synonyms, category terms, and common variations. Return ONLY a JSON array of strings. No extra text.`;

  return `${base}\n\n${context}${instruction}`;
}

export function buildProductRecommendationsPrompt({ userPurchases, userWishlist, allProducts }) {
  const base = `You are a product recommendation engine for an e-commerce store.`;
  const context = `User's recent purchases: ${userPurchases.map(p => `${p.productName} (${p.category})`).join(', ') || 'None'}\nUser's wishlist: ${userWishlist.map(p => `${p.name} (${p.category})`).join(', ') || 'None'}`;
  const instruction = `\n\nAvailable products: ${allProducts.slice(0, 50).map(p => `${p.name} (${p.category}, $${p.price})`).join(', ')}\n\nRecommend 5 products the user might like. Return ONLY a JSON array of objects: [{ "productId": "...", "reason": "..." }]. No extra text.`;

  return `${base}\n\n${context}${instruction}`;
}