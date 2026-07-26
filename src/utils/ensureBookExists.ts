/**
 * Lazy book creation helper.
 *
 * Flow contract: the chat produces an OUTLINE only — nothing is written to the
 * database. The book record (and its pages) is created the first time the user
 * generates or uploads an image. Every image-producing action funnels through
 * `ensureBookExists` so creation happens exactly once.
 */

export interface EnsuredBook {
  bookId: string;
  pages: Array<{ id: string; page_number: number }>;
}

export interface EnsureBookState {
  inFlight: Promise<EnsuredBook | null> | null;
}

export function createEnsureBookState(): EnsureBookState {
  return { inFlight: null };
}

export interface EnsureBookOptions {
  /** Current book id, if the book already exists. */
  bookId?: string | null;
  /** Fetches the pages for an already-created book. */
  getExistingPages?: (bookId: string) => Promise<Array<{ id: string; page_number: number }>>;
  /** Creates the book from the chat outline and resolves its pages. */
  createBookAndWait?: () => Promise<EnsuredBook | null>;
  /** Called before creation starts (e.g. to show a toast). */
  onCreateStart?: () => void;
  /** Called when creation is unavailable or fails. */
  onError?: (message: string) => void;
}

/**
 * Returns the book (creating it if needed). Idempotent and concurrency-safe:
 * two rapid clicks share the same in-flight promise, so only one book is made.
 */
export async function ensureBookExists(
  state: EnsureBookState,
  options: EnsureBookOptions
): Promise<EnsuredBook | null> {
  const { bookId, getExistingPages, createBookAndWait, onCreateStart, onError } = options;

  if (bookId) {
    const pages = getExistingPages ? await getExistingPages(bookId) : [];
    return { bookId, pages };
  }

  if (state.inFlight) return state.inFlight;

  if (!createBookAndWait) {
    onError?.('Book creation is not available here.');
    return null;
  }

  onCreateStart?.();

  const run = (async () => {
    try {
      const result = await createBookAndWait();
      if (!result) {
        onError?.('Could not create your book. Please try again.');
        return null;
      }
      return result;
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not create your book.');
      return null;
    } finally {
      state.inFlight = null;
    }
  })();

  state.inFlight = run;
  return run;
}

/** Page type derived from page number for freshly created books. */
export function derivePageType(pageNumber: number): 'cover' | 'educational' | 'content' {
  if (pageNumber === 1) return 'cover';
  if (pageNumber === 2) return 'educational';
  return 'content';
}
