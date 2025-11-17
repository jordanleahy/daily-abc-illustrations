export const queryKeys = {
  library: {
    books: ['library-books-decoupled'] as const,
    bookById: (bookId: string) => ['library-book-decoupled', bookId] as const,
    bookPages: (bookId: string) => ['library-book-pages-decoupled', bookId] as const,
  },
} as const;
