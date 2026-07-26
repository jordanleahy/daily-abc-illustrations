/**
 * bookPrompts — single source of truth for image-prompt extraction/finalization.
 *
 * Before this module existed, the same "extract **Page N: Title** prompts from
 * assistant markdown" logic was implemented 5 separate times (GoogleChat.tsx x2,
 * useGoogleCreateBook.ts, chatHelpers.ts, pageHelpers.ts) with inconsistent
 * sanitization and two different cover-title wordings. Everything now funnels
 * through here so Copy Prompt, Generate, and book creation always agree.
 *
 * Sanitization happens exactly once, at extraction time.
 */

import { parseBookOutline, extractPromptsRecord, getPagePrompt, type ParsedOutline } from './pageHelpers';
import { sanitizeImagePrompt } from './promptSanitizer';

export type PromptsRecord = Record<number, string>;

interface ChatMessageLike {
  role: string;
  content: unknown;
}

/** The ONE cover title directive. Never duplicate this string elsewhere. */
export const COVER_TITLE_DIRECTIVE =
  'DISPLAY TITLE: Display the title in large, bold, CENTERED letters at the center of the cover, taking up 50-60% of the visual space.';

const COVER_PATTERN =
  /\*\*(?:Cover:[^\n*]*|Page\s+1:\s*Cover)\*\*\s*([\s\S]*?)(?=\n\*\*(?:Educational Focus:|Page\s+2:)|\n\*\*Page\s+\d+|$)/i;
const COVER_TITLE_PATTERN = /\*\*(?:Cover:\s*([^*\n]+?)|Page\s+1:\s*Cover)\*\*/i;
const EDU_PATTERN =
  /\*\*(?:Educational Focus:[^\n*]*|Page\s+2:\s*(?:Educational\s+)?Focus)\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/i;

const hasCenterDirective = (text: string) => /\bcenter(ed)?\b/i.test(text);

/**
 * Normalizes a cover prompt: square-card framing + a single centered-title directive.
 * Idempotent — safe to call on an already-finalized prompt.
 */
export const finalizeCoverPrompt = (prompt: string, title?: string | null): string => {
  let out = prompt.replace(/\bbook cover\b/gi, 'square card cover');
  if (!hasCenterDirective(out)) {
    const directive = title
      ? COVER_TITLE_DIRECTIVE.replace('the title', `"${title}"`)
      : COVER_TITLE_DIRECTIVE;
    out = `${out}\n\n${directive}`;
  }
  return out;
};

const assistantText = (messages: ChatMessageLike[]): string =>
  messages
    .filter((m) => m.role === 'assistant' && typeof m.content === 'string')
    .map((m) => m.content as string)
    .join('\n');

/**
 * Extracts every page prompt from the conversation, sanitized once.
 * Uses the structured outline as the primary source, and the legacy
 * `**Cover:**` / `**Educational Focus:**` headings as a fallback for
 * pages 1 and 2 when the outline is missing them.
 */
export const extractOutlinePrompts = (
  messages: ChatMessageLike[],
  outline?: ParsedOutline | null
): PromptsRecord => {
  const parsed = outline ?? parseBookOutline(messages as any[]);
  const prompts: PromptsRecord = { ...extractPromptsRecord(parsed) };

  const text = assistantText(messages);

  if (!prompts[1]) {
    const coverMatch = text.match(COVER_PATTERN);
    if (coverMatch) {
      const titleMatch = text.match(COVER_TITLE_PATTERN);
      prompts[1] = sanitizeImagePrompt(coverMatch[0]);
      prompts[1] = finalizeCoverPrompt(prompts[1], titleMatch?.[1]?.trim() || null);
    }
  } else {
    prompts[1] = finalizeCoverPrompt(prompts[1], parsed?.coverPage?.title || null);
  }

  if (!prompts[2]) {
    const eduMatch = text.match(EDU_PATTERN);
    if (eduMatch) prompts[2] = sanitizeImagePrompt(eduMatch[0]);
  }

  return prompts;
};

/**
 * Edit-mode reconstruction: older sessions embedded prompts as
 * `<qa_page_N>...</qa_page_N>` or `Page N: LETTER: ...` blocks.
 */
export const extractEditModePrompts = (messages: ChatMessageLike[]): PromptsRecord => {
  const text = assistantText(messages);
  const prompts: PromptsRecord = {};

  for (let i = 1; i <= 26; i++) {
    const letter = String.fromCharCode(64 + i);
    const patterns = [
      new RegExp(`<qa_page_${i}>([\\s\\S]*?)</qa_page_${i}>`, 'i'),
      new RegExp(`Page ${i}[:\\s-]+${letter}[:\\s-]+([\\s\\S]*?)(?=Page ${i + 1}|$)`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        prompts[i] = sanitizeImagePrompt(match[1].trim());
        break;
      }
    }
  }

  return prompts;
};

interface ReadPromptSources {
  storedPrompts?: PromptsRecord;
  dbPages?: Array<{ page_number: number; description?: string | null; content?: unknown }> | null;
  outline?: ParsedOutline | null;
  isBookCreated?: boolean;
}

/**
 * Read-time accessor used by the QA editor. Prompts are already sanitized at
 * extraction time; legacy DB rows are sanitized defensively here.
 */
export const readPagePrompt = (pageNum: number, sources: ReadPromptSources): string | null => {
  const { storedPrompts, dbPages, outline, isBookCreated } = sources;

  if (storedPrompts?.[pageNum]) return storedPrompts[pageNum];

  if (isBookCreated && dbPages && dbPages.length > 0) {
    const page = dbPages.find((p) => p.page_number === pageNum);
    if (!page) return null;
    const fullPrompt = (page.content as { imagePrompt?: string } | null)?.imagePrompt;
    if (fullPrompt) return sanitizeImagePrompt(fullPrompt);
    if (page.description) return sanitizeImagePrompt(page.description);
    return null;
  }

  const raw = getPagePrompt(outline ?? null, pageNum);
  if (!raw) return null;
  const sanitized = sanitizeImagePrompt(raw);
  return pageNum === 1
    ? finalizeCoverPrompt(sanitized, outline?.coverPage?.title || null)
    : sanitized;
};

/** Builds the deterministic fast-path outline payload for google-create-book. */
export const buildOutlinePayload = (outline: ParsedOutline | null | undefined) => {
  if (!outline || !outline.coverPage) return undefined;
  return {
    bookName: outline.coverPage.title,
    bookDescription: outline.coverPage.description || '',
    pages: Array.from(outline.allPages.values()).map((p) => ({
      pageNumber: p.pageNumber,
      pageType: p.pageType,
      title: p.title,
      description: p.description,
    })),
  };
};
