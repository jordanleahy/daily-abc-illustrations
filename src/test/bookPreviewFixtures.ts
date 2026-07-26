/**
 * Test-only replica of the page-row mapping in
 * `supabase/functions/google-create-book/index.ts`.
 *
 * The edge function builds `pages` rows inline (sanitizer + textOverlay
 * policy) and can't be imported here — it boots a Deno server on import.
 * This helper mirrors that mapping exactly so the e2e preview test exercises
 * the *stored* shape (post-sanitization) rather than the raw builder output.
 *
 * If `index.ts` changes its row mapping, update this file in lockstep.
 */
import { outlineToBook, type OutlineToBookInput } from '../../supabase/functions/google-create-book/outlineToBook';
import { buildEducationalFocusOverlayText } from '../../supabase/functions/_shared/educationalFocus';
import type { Page } from '@/types/book';

/** Mirrors `sanitizeText` in google-create-book/index.ts (line ~196). */
export const sanitizeText = (text: string, maxLength: number): string =>
  (text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/[^\w\s.,!?'"#-]/g, '')
    .substring(0, maxLength)
    .trim();

export interface BuildPagesOptions {
  /** User preference for text overlays on *content* pages. */
  showTextOverlay?: boolean;
}

/**
 * outline → adapter → DB rows → `Page[]` as the reading views receive them.
 */
export function buildStoredPages(
  input: OutlineToBookInput,
  { showTextOverlay = true }: BuildPagesOptions = {},
): Page[] {
  const bookData = outlineToBook(input);

  const contentPageCount = bookData.pages.filter((p) => p.pageType === 'content').length;
  const focusOverlayText = buildEducationalFocusOverlayText({
    bookType: input.bookType,
    category: bookData.category,
    gradeLevel: input.gradeLevel,
    targetAge: input.targetAge,
    contentPageCount,
  });

  return bookData.pages.map((page) => {
    const isCover = page.pageType === 'cover';
    const textOverlayEnabled = isCover
      ? false
      : page.pageType === 'educational'
        ? true
        : showTextOverlay;

    const overlayText = page.pageType === 'educational' ? focusOverlayText : page.title;

    return {
      id: `page-${page.pageNumber}`,
      book_id: 'book-1',
      page_type: page.pageType,
      letter: sanitizeText(page.letter || `Page ${page.pageNumber}`, 10),
      page_identifier: sanitizeText(page.letter || `Page ${page.pageNumber}`, 50),
      page_number: page.pageNumber,
      title: sanitizeText(page.title, 100),
      description: sanitizeText(page.description || '', 500),
      content: {
        mainConcept: sanitizeText(page.content.mainConcept, 500),
        funFact: sanitizeText(page.content.funFact, 500),
        activity: sanitizeText(page.content.activity, 500),
        imagePrompt: '',
        textOverlay: {
          enabled: textOverlayEnabled,
          text: sanitizeText(overlayText, 100),
          position: 'bottom-center' as const,
          createdAt: '2026-07-26T00:00:00.000Z',
        },
      },
    } as unknown as Page;
  });
}

/** Book types that use the 12-page structure with a page-2 focus page. */
export const TWELVE_PAGE_BOOK_TYPES = [
  'digraphs', 'rhyming', 'numbers', 'shapes', 'colors', 'dr-seuss',
  'opposites', 'emotions', 'animals', 'first-words', 'bedtime', 'cvc',
  'sight-words', 'general', 'parent-education', 'song', 'manners',
];

/** All active book types (ABC uses the 28-page structure, no focus page). */
export const ALL_BOOK_TYPES = ['abc', ...TWELVE_PAGE_BOOK_TYPES];

/** Builds a realistic outline of the right length for a book type. */
export function makeOutline(bookType: string, gradeLevel = 'PRE_K'): OutlineToBookInput {
  const totalPages = bookType === 'abc' ? 28 : 12;
  const letters = 'abcdefghijklmnopqrstuvwxyz';

  const pages = Array.from({ length: totalPages }, (_, i) => {
    const pageNumber = i + 1;
    if (pageNumber === 1) return { pageNumber, title: `Shelly's ${bookType} Book` };
    if (bookType === 'abc') {
      const letter = letters[pageNumber - 2] ?? 'z';
      return {
        pageNumber,
        title: `${letter.toUpperCase()} is for ${letter.toUpperCase()}pple`,
        description: `Letter ${letter} page`,
      };
    }
    if (pageNumber === 2) return { pageNumber, title: 'Educational Focus' };
    return { pageNumber, title: `Page ${pageNumber} concept`, description: `Description ${pageNumber}` };
  });

  return {
    bookName: `Shelly's ${bookType} Book`,
    bookDescription: 'A test book',
    category: 'General',
    bookType,
    gradeLevel,
    pages,
  };
}
