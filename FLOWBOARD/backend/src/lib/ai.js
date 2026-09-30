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

export function buildTaskDescriptionPrompt({ title, projectName, existingDescription }) {
  const base = `You are a helpful project management assistant. Generate a clear, actionable task description.`;
  const context = `Project: "${projectName}"\nTask title: "${title}"`;
  const existing = existingDescription ? `\nCurrent description: "${existingDescription}"\nImprove and expand this.` : '';
  const instruction = '\n\nWrite a concise description (3-6 sentences) covering: what needs to be done, any context, and acceptance criteria. Use professional tone. No markdown.';

  return `${base}\n\n${context}${existing}${instruction}`;
}

export function buildProjectDescriptionPrompt({ name, existingDescription }) {
  const base = `You are a helpful project management assistant. Generate a clear project description.`;
  const context = `Project name: "${name}"`;
  const existing = existingDescription ? `\nCurrent description: "${existingDescription}"\nImprove and expand this.` : '';
  const instruction = '\n\nWrite a concise description (4-8 sentences) covering: project goals, scope, key deliverables, and success criteria. Use professional tone. No markdown.';

  return `${base}\n\n${context}${existing}${instruction}`;
}

export function buildCommentAssistPrompt({ taskTitle, taskDescription, context, intent }) {
  const base = `You are a helpful project management assistant. Help draft a comment on a task.`;
  const taskInfo = `Task: "${taskTitle}"\nDescription: "${taskDescription || 'No description'}"`;
  const contextInfo = context ? `\nRelevant context: ${context}` : '';
  const intentMap = {
    update: 'Write a brief progress update (1-2 sentences).',
    question: 'Write a clear question for the team (1-2 sentences).',
    blocker: 'Describe what is blocking progress and what help is needed (2-3 sentences).',
    handoff: 'Write a handoff note summarizing current state and next steps (2-3 sentences).',
  };
  const instruction = intentMap[intent] || 'Write a helpful comment (1-3 sentences). Professional tone. No markdown.';

  return `${base}\n\n${taskInfo}${contextInfo}\n\n${instruction}`;
}

export function buildTaskSuggestionsPrompt({ projectName, recentTasks, taskTitles }) {
  const base = `You are a project management assistant. Suggest 3-5 new tasks for a project.`;
  const context = `Project: "${projectName}"`;
  const recent = recentTasks?.length
    ? `\nRecent activity: ${recentTasks.slice(0, 5).map((t) => t.title).join(', ')}`
    : '';
  const existing = taskTitles?.length
    ? `\nExisting task titles: ${taskTitles.slice(0, 20).join(', ')}`
    : '';
  const instruction = '\n\nReturn ONLY a JSON array of objects: [{ "title": "...", "priority": "LOW|MEDIUM|HIGH|URGENT", "suggestedDescription": "..." }]. No extra text.';

  return `${base}\n\n${context}${recent}${existing}${instruction}`;
}