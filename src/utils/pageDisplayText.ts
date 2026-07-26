import type { Page } from '@/types/book';

/**
 * Resolves the text shown under a page in the reading preview.
 *
 * Educational Focus pages (page 2) carry their age/grade + learning lines in
 * `content` (written deterministically at book creation), not in `title` —
 * the title is just the internal label "Educational Focus". Rendering
 * `title` there produced a blank-looking page, so resolve from content first.
 */
export function getPageDisplayText(page: Pick<Page, 'title' | 'page_type' | 'content'> | null | undefined): string {
  if (!page) return '';

  const content = (page.content ?? {}) as Record<string, unknown>;
  const title = typeof page.title === 'string' ? page.title.trim() : '';

  if (page.page_type !== 'educational') return title;

  // Legacy books stored the internal label ("Educational Focus") as the
  // overlay text — that reads as a blank page, so ignore it and compose
  // from the content lines instead.
  const overlay = content.textOverlay as { text?: unknown } | undefined;
  const overlayText = typeof overlay?.text === 'string' ? overlay.text.trim() : '';
  if (overlayText && overlayText !== title) return overlayText;


  const lines = ['mainConcept', 'funFact', 'activity']
    .map((key) => (typeof content[key] === 'string' ? (content[key] as string).trim() : ''))
    .filter((line) => line.length > 0);

  if (lines.length > 0) return lines.join(' · ');

  return title;
}

/** True when the page's text should be shown as a plain caption (no word carousel). */
export function isCaptionOnlyPage(pageType?: string | null): boolean {
  return pageType === 'educational';
}
