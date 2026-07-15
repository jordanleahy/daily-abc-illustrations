import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate every library/city/daily-published-derived query so the
 * public Library reflects a new publication immediately, without waiting
 * for the global staleTime.
 */
export const invalidateLibraryQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['book'] });
  queryClient.invalidateQueries({ queryKey: ['books'] });
  queryClient.invalidateQueries({ queryKey: ['book-publication-status'] });
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === 'string' && (
        k.startsWith('library') ||
        k.startsWith('city-books') ||
        k.startsWith('all-books') ||
        k.startsWith('daily-published') ||
        k.startsWith('seo-metadata') ||
        k.startsWith('upcoming-daily-published')
      );
    },
  });
};
