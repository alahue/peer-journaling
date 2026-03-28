import { generateContent, parseJsonResponse } from './gemini.js';
import type { ValidatorResult } from '../types.js';

const SYSTEM_PROMPT = `You are a content safety validator for a peer journaling platform. You will be given a journal entry that has already been processed by a mediator. Your job is to verify that it is free of:
1. Potentially harmful or abusive language
2. Personal identifiers such as names, phone numbers, and addresses

Respond in exactly this JSON format:
{
  "passed": true or false,
  "issues": ["list of issues found, if any"]
}`;

export async function validateEntry(polishedEntry: string): Promise<ValidatorResult> {
  const userPrompt = `Is this journal entry free of potentially harmful/abusive language and personal identifiers such as names, phone numbers, and addresses?\n\n${polishedEntry}`;
  const response = await generateContent(SYSTEM_PROMPT, userPrompt);
  return parseJsonResponse<ValidatorResult>(response);
}
