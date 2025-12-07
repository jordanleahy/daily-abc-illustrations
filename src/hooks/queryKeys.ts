export const queryKeys = {
  library: {
    books: ['library-books'] as const,
    bookById: (bookId: string) => ['library-book', bookId] as const,
    bookPages: (bookId: string) => ['library-book-pages', bookId] as const,
  },
  pages: {
    byBook: (bookId: string) => ['book-pages', bookId] as const,
  },
} as const;
