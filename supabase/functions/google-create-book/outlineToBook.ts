/**
 * outlineToBook — pure adapter that maps the chat/outline shape produced by
 * `src/utils/pageHelpers.ts::parseBookOutline` into the `BookDataSchema`
 * shape consumed by `google-create-book`.
 *
 * Rationale (see chat 2026-07-20): the outline agent already produced every
 * field we need — bookName, per-page titles, per-page descriptions. Asking a
 * second LLM to re-shape the same data introduces schema drift ("title" vs
 * "bookName", "page_number" vs "pageNumber") and silently fails the
 * "Create My Book" click. This adapter is a deterministic, unit-testable
 * transform so create-book becomes a pure pass-through when a full outline
 * exists.
 */

export interface OutlinePageInput {
  pageNumber: number;
  pageType?: 'cover' | 'educational' | 'content';
  title: string;
  description?: string;
}

export interface OutlineToBookInput {
  bookName: string;
  bookDescription?: string;
  category?: string;
  bookType?: string;
  pages: OutlinePageInput[];
}

export interface AdaptedPage {
  pageNumber: number;
  pageType: 'cover' | 'educational' | 'content';
  letter?: string;
  title: string;
  description: string;
  content: {
    mainConcept: string;
    funFact: string;
    activity: string;
  };
}

export interface AdaptedBookData {
  bookName: string;
  category: string;
  bookDescription: string;
  metadata: { bookType?: string; pageCount: number };
  pages: AdaptedPage[];
}

const LETTER_PATTERNS: RegExp[] = [
  /\(([A-Za-z])\)\s*is\s+for/i,     // "(a) is for apple"
  /\b([A-Za-z])\s+is\s+for\b/i,     // "A is for Apple"
  /^\s*\*?\*?([A-Za-z])[:.\-]/,     // "**A:** Apple"
  /^\s*\(?([A-Za-z])\)?\s+/,        // fallback: leading letter token
];

export const extractLetter = (title: string): string | undefined => {
  if (!title) return undefined;
  for (const re of LETTER_PATTERNS) {
    const m = title.match(re);
    if (m && m[1]) return m[1].toLowerCase();
  }
  return undefined;
};

const inferPageType = (
  pageNumber: number,
  explicit: OutlinePageInput['pageType'],
  bookType: string | undefined,
  totalPages: number,
): AdaptedPage['pageType'] => {
  if (explicit) return explicit;
  if (pageNumber === 1) return 'cover';
  // 12-page structure (all non-ABC book types) has educational at page 2.
  const isTwelvePage = totalPages === 12 && bookType !== 'abc';
  if (pageNumber === 2 && isTwelvePage) return 'educational';
  return 'content';
};

/**
 * Deterministic mapping from outline → BookDataSchema. No AI, no network.
 * Throws a descriptive Error when the input is missing something required
 * so `google-create-book` can surface it in the ErrorDetailsPanel.
 */
export const outlineToBook = (input: OutlineToBookInput): AdaptedBookData => {
  if (!input || typeof input !== 'object') {
    throw new Error('outlineToBook: input is required');
  }
  const bookName = (input.bookName || '').trim();
  if (!bookName) throw new Error('outlineToBook: bookName is required');

  const pages = Array.isArray(input.pages) ? input.pages : [];
  if (pages.length === 0) throw new Error('outlineToBook: at least one page is required');

  const seen = new Set<number>();
  const adapted: AdaptedPage[] = [];

  for (const p of pages) {
    if (!p || typeof p.pageNumber !== 'number' || p.pageNumber < 1) {
      throw new Error(`outlineToBook: invalid pageNumber on page ${JSON.stringify(p)}`);
    }
    if (seen.has(p.pageNumber)) {
      throw new Error(`outlineToBook: duplicate pageNumber ${p.pageNumber}`);
    }
    seen.add(p.pageNumber);

    const title = (p.title || '').trim();
    if (!title) throw new Error(`outlineToBook: missing title on page ${p.pageNumber}`);

    const pageType = inferPageType(p.pageNumber, p.pageType, input.bookType, pages.length);
    const description = (p.description || '').trim() || title;
    const letter = pageType === 'cover'
      ? 'COVER'
      : pageType === 'educational'
        ? 'FOCUS'
        : extractLetter(title);

    adapted.push({
      pageNumber: p.pageNumber,
      pageType,
      letter,
      title: pageType === 'cover' ? bookName : title,
      description,
      content: {
        mainConcept: pageType === 'cover' ? bookName : title,
        funFact: pageType === 'cover' ? (input.bookDescription || '') : '',
        activity: '',
      },
    });
  }

  adapted.sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    bookName,
    category: input.category || 'General',
    bookDescription: input.bookDescription || '',
    metadata: { bookType: input.bookType, pageCount: adapted.length },
    pages: adapted,
  };
};
