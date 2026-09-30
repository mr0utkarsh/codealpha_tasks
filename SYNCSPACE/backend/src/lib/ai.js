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
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
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
    temperature: 0.3,
    max_tokens: 1024,
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

export function buildSummarizePrompt(messages) {
  const base = `You are a helpful meeting assistant. Summarize the following chat messages from a real-time communication room.`;
  const messagesText = messages
    .map((m) => `${m.user?.name || 'User'}: ${m.content}`)
    .join('\n');
  const instruction = '\n\nProvide a concise summary (3-5 bullet points) covering: key topics discussed, decisions made, action items, and any open questions. Professional tone. No markdown.';

  return `${base}\n\n${messagesText}${instruction}`;
}

export function buildRewritePrompt(message, tone) {
  const base = `You are a helpful communication assistant. Rewrite the following message with a different tone.`;
  const messageText = `Original message: "${message}"`;
  const toneMap = {
    professional: 'Make it more formal and professional.',
    friendly: 'Make it more casual and friendly.',
    concise: 'Make it shorter and more direct.',
    polite: 'Make it more polite and courteous.',
    assertive: 'Make it more direct and confident.',
  };
  const instruction = `\n\n${toneMap[tone] || 'Improve clarity and tone.'} Return ONLY the rewritten message. No explanations. No markdown.`;

  return `${base}\n\n${messageText}${instruction}`;
}

export function buildSuggestRepliesPrompt(messages, userName) {
  const base = `You are a helpful communication assistant. Suggest 3 short reply options for the current user.`;
  const recentMessages = messages.slice(-10).map((m) => `${m.user?.name || 'User'}: ${m.content}`).join('\n');
  const instruction = `\n\nContext: Recent messages:\n${recentMessages}\n\nCurrent user: "${userName}"\n\nReturn ONLY a JSON array of 3 short reply strings (max 160 chars each). No extra text. Example: ["Sounds good, let's do it.", "I have a question about...", "Can we discuss this later?"]`;

  return `${base}${instruction}`;
}