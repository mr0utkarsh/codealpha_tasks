import { asyncHandler } from '../lib/asyncHandler.js';
import { ok } from '../lib/respond.js';
import {
  generateWithFallback,
  buildTaskDescriptionPrompt,
  buildProjectDescriptionPrompt,
  buildCommentAssistPrompt,
  buildTaskSuggestionsPrompt,
} from '../lib/ai.js';
import { requireProjectAccess } from '../lib/access.js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../lib/ApiError.js';

export const generateTaskDescription = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, existingDescription } = req.body;

  if (!title?.trim()) throw ApiError.badRequest('Task title is required');

  const { project } = await requireProjectAccess(projectId, req.user);

  const prompt = buildTaskDescriptionPrompt({
    title,
    projectName: project.name,
    existingDescription,
  });

  try {
    const description = await generateWithFallback(prompt);
    ok(res, { description });
  } catch (err) {
    console.error('[AI] Task description generation failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const generateProjectDescription = asyncHandler(async (req, res) => {
  const { name, existingDescription } = req.body;

  if (!name?.trim()) throw ApiError.badRequest('Project name is required');

  const prompt = buildProjectDescriptionPrompt({ name, existingDescription });

  try {
    const description = await generateWithFallback(prompt);
    ok(res, { description });
  } catch (err) {
    console.error('[AI] Project description generation failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const assistComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { intent, context } = req.body;

  const { task, project } = await requireProjectAccess(taskId, req.user);

  const prompt = buildCommentAssistPrompt({
    taskTitle: task.title,
    taskDescription: task.description,
    context,
    intent,
  });

  try {
    const suggestion = await generateWithFallback(prompt);
    ok(res, { suggestion });
  } catch (err) {
    console.error('[AI] Comment assist failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});

export const suggestTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const { project } = await requireProjectAccess(projectId, req.user);

  const [recentTasks, allTasks] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { title: true, status: true, updatedAt: true },
    }),
    prisma.task.findMany({
      where: { projectId: project.id },
      select: { title: true },
    }),
  ]);

  const prompt = buildTaskSuggestionsPrompt({
    projectName: project.name,
    recentTasks,
    taskTitles: allTasks.map((t) => t.title),
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
    console.error('[AI] Task suggestions failed:', err.message);
    throw ApiError.serviceUnavailable('AI service temporarily unavailable');
  }
});