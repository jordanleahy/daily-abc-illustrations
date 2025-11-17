export const DB_CONSTANTS = {
  PAGE_TYPES: {
    COVER: 'cover' as const,
    CONTENT: 'content' as const,
    EDUCATIONAL: 'educational' as const,
  },
  
  CHANNELS: {
    LIBRARY_BOOKS: 'library-books-changes',
    LIBRARY_DAILY_PUBLISHED: 'library-daily-published-changes',
    LIBRARY_SEO: 'library-seo-changes',
  },
  
  FILTERS: {
    IS_LIBRARY_BOOK: 'is_library_book=eq.true',
  },
} as const;
