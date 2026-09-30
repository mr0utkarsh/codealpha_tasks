import { asyncHandler } from '../lib/asyncHandler.js';
import { ok } from '../lib/respond.js';
import {
  generateWithFallback,
  buildSummarizePrompt,
  buildRewritePrompt,
  buildSuggestRepliesPrompt,
} from '../lib/ai.js';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';

export const summarizeChat = asyncHandler(async (req, res) => {
  const { roomCode } = req.params;
  const { limit = 50 } = req.query;

  const room = await prisma.room.findUnique({ where: { roomCode: roomCode.toUpperCase() } });
  if (!room) throw ApiError.notFound('Room not found');

  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden('Not a member of this room');

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit, 10),
    include: { user: { select: { id: true, name: true } } },
  });

  if (messages.length === 0) {
    return ok(res, { summary: 'No messages to summarize.' });
  }

  const prompt = buildSummarizePrompt(messages.reverse());

  try {
    const summary = await generateWithFallback(prompt);
    ok(res, { summary });
  } catch (err) {
    console.error('[AI] Chat summarization failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const rewriteMessage = asyncHandler(async (req, res) => {
  const { message, tone } = req.body;

  if (!message?.trim()) throw ApiError.badRequest('Message is required');
  if (!tone) throw ApiError.badRequest('Tone is required');

  const prompt = buildRewritePrompt(message.trim(), tone);

  try {
    const rewritten = await generateWithFallback(prompt);
    ok(res, { rewritten });
  } catch (err) {
    console.error('[AI] Message rewrite failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const suggestReplies = asyncHandler(async (req, res) => {
  const { roomCode } = req.params;
  const { limit = 20 } = req.query;

  const room = await prisma.room.findUnique({ where: { roomCode: roomCode.toUpperCase() } });
  if (!room) throw ApiError.notFound('Room not found');

  const membership = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
  });
  if (!membership) throw ApiError.forbidden('Not a member of this room');

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit, 10),
    include: { user: { select: { id: true, name: true } } },
  });

  const prompt = buildSuggestRepliesPrompt(messages.reverse(), req.user.name);

  try {
    const text = await generateWithFallback(prompt);
    let suggestions = [];
    try {
      suggestions = JSON.parse(text);
      if (!Array.isArray(suggestions)) throw new Error('Not an array');
    } catch {
      throw new Error('Invalid AI response format');
    }
    ok(res, { suggestions: suggestions.slice(0, 3) });
  } catch (err) {
    console.error('[AI] Reply suggestions failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});