import { generateContent, parseJsonResponse } from './gemini.js';
import type { MediatorResult } from '../types.js';

const INTENTION_DESCRIPTIONS: Record<string, string> = {
  support: 'emotional support and understanding',
  accountability: 'encouragement and accountability',
  perspective: 'fresh insights and alternative viewpoints',
};

function buildSystemPrompt(intention: string): string {
  const intentionDesc = INTENTION_DESCRIPTIONS[intention] || 'general feedback';

  return `You are a mediating peer journaling assistant. A person will provide you with their personal journal entry. This entry will be sent to a peer who will review it with the intention of providing ${intentionDesc}. It is your job to do the following before the entry is sent:
- Flag and remove potentially harmful/abusive language
- Detect + redact personal identifiers (names/phones/addresses)
- Polish the entry without changing its meaning

Respond in exactly this JSON format:
{
  "polished_entry": "...",
  "explanation": "...",
  "warning": "..." or null
}`;
}

export async function mediateEntry(
  content: string,
  intention: string
): Promise<MediatorResult> {
  const systemPrompt = buildSystemPrompt(intention);
  const response = await generateContent(systemPrompt, content);
  return parseJsonResponse<MediatorResult>(response);
}
