/**
 * Centralized query keys for react-query cache management.
 * Using this ensures consistent cache invalidation across all hooks.
 */
export const queryKeys = {
  // Library (existing)
  library: {
    books: ['library-books'] as const,
    bookById: (bookId: string) => ['library-book', bookId] as const,
    bookPages: (bookId: string) => ['library-book-pages', bookId] as const,
  },

  // Pages
  pages: {
    byBook: (bookId: string) => ['book-pages', bookId] as const,
  },

  // Books
  books: {
    all: ['books'] as const,
    byId: (id: string) => ['book', id] as const,
    publicationStatus: ['book-publication-status'] as const,
  },

  // Habits
  habits: {
    all: ['habits'] as const,
    today: ['today-habits'] as const,
    schedule: ['habit-schedule'] as const,
    isBookHabit: ['is-book-habit'] as const,
    my: ['my-habits'] as const,
  },

  // Tricks
  tricks: {
    all: ['tricks'] as const,
    goals: ['trick-goals'] as const,
  },

  // Kid Profiles
  kidProfiles: {
    all: ['kid-profiles'] as const,
    byUser: (userId: string) => ['kid-profiles', userId] as const,
    coins: ['kid-coins'] as const,
  },

  // Rewards
  rewards: {
    products: ['rewards-products'] as const,
    purchases: ['kid-purchases'] as const,
  },

  // Daily Published
  dailyPublished: {
    all: ['daily-published'] as const,
    queue: ['daily-published-queue'] as const,
    schedule: ['daily-published-schedule'] as const,
    active: ['active-daily-published'] as const,
  },

  // Cities
  cities: {
    all: ['cities'] as const,
    landmarks: ['city-landmarks'] as const,
    options: ['question-options'] as const,
  },

  // Profile
  profile: ['profile'] as const,

  // Agents
  agents: {
    all: ['agents'] as const,
    byId: (id: string) => ['agent', id] as const,
    latest: ['agents-latest'] as const,
  },

  // Chat Sessions
  chatSessions: {
    all: ['chat-sessions'] as const,
    byId: (id: string) => ['chat-session', id] as const,
  },
} as const;
