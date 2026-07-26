import { describe, it, expect, vi } from 'vitest';
import {
  ensureBookExists,
  createEnsureBookState,
  derivePageType,
} from './ensureBookExists';

const book = { bookId: 'b1', pages: [{ id: 'p1', page_number: 1 }] };

describe('ensureBookExists', () => {
  it('does not create when a book already exists', async () => {
    const createBookAndWait = vi.fn();
    const getExistingPages = vi.fn().mockResolvedValue(book.pages);
    const result = await ensureBookExists(createEnsureBookState(), {
      bookId: 'b1',
      getExistingPages,
      createBookAndWait,
    });
    expect(createBookAndWait).not.toHaveBeenCalled();
    expect(result).toEqual(book);
  });

  it('creates the book once under concurrent calls', async () => {
    const state = createEnsureBookState();
    let resolve!: (v: typeof book) => void;
    const createBookAndWait = vi.fn(
      () => new Promise<typeof book>((r) => { resolve = r; })
    );

    const a = ensureBookExists(state, { createBookAndWait });
    const b = ensureBookExists(state, { createBookAndWait });
    resolve(book);

    expect(await a).toEqual(book);
    expect(await b).toEqual(book);
    expect(createBookAndWait).toHaveBeenCalledTimes(1);
  });

  it('reports an error and returns null when creation is unavailable', async () => {
    const onError = vi.fn();
    const result = await ensureBookExists(createEnsureBookState(), { onError });
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('surfaces creation failure without returning a book', async () => {
    const onError = vi.fn();
    const result = await ensureBookExists(createEnsureBookState(), {
      createBookAndWait: vi.fn().mockResolvedValue(null),
      onError,
    });
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('surfaces thrown creation errors and clears the in-flight slot', async () => {
    const state = createEnsureBookState();
    const onError = vi.fn();
    const result = await ensureBookExists(state, {
      createBookAndWait: vi.fn().mockRejectedValue(new Error('OUTLINE_REQUIRED')),
      onError,
    });
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalledWith('OUTLINE_REQUIRED');
    expect(state.inFlight).toBeNull();

    // A later attempt can retry
    const retry = await ensureBookExists(state, {
      createBookAndWait: vi.fn().mockResolvedValue(book),
    });
    expect(retry).toEqual(book);
  });

  it('calls onCreateStart only when creating', async () => {
    const onCreateStart = vi.fn();
    await ensureBookExists(createEnsureBookState(), {
      bookId: 'b1',
      getExistingPages: vi.fn().mockResolvedValue([]),
      onCreateStart,
    });
    expect(onCreateStart).not.toHaveBeenCalled();

    await ensureBookExists(createEnsureBookState(), {
      createBookAndWait: vi.fn().mockResolvedValue(book),
      onCreateStart,
    });
    expect(onCreateStart).toHaveBeenCalledTimes(1);
  });
});

describe('derivePageType', () => {
  it('maps page numbers to types', () => {
    expect(derivePageType(1)).toBe('cover');
    expect(derivePageType(2)).toBe('educational');
    expect(derivePageType(3)).toBe('content');
  });
});
