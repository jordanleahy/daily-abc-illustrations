/**
 * Library Configuration
 * Centralized configuration for all library-related features
 */

export const LIBRARY_CONFIG = {
  // Display Settings
  display: {
    /**
     * Default page count for ABC books when total_pages is not available
     * Most ABC books follow the A-Z format (26 letters)
     */
    defaultPageCount: 26,
    
    /**
     * Number of book cards to load immediately (above the fold)
     * These bypass lazy loading for instant display
     */
    priorityCardCount: 6,
    
    /**
     * Number of cards to always render in detail view
     * Prevents layout shift on initial load
     */
    aboveFoldCardCount: 3,
  },

  // Cache Configuration
  cache: {
    /**
     * How long to cache library data in localStorage (30 minutes)
     * Improves load times for returning users
     */
    duration: 30 * 60 * 1000,
    
    /**
     * localStorage key for library book cache
     */
    cacheKey: 'library-books-cache',
  },

  // Image Optimization
  images: {
    cardThumbnail: {
      width: 800,
      quality: 85,
    },
    detailView: {
      width: 800,
      quality: 85,
    },
  },

  // Progressive Image Loading
  imagePreloader: {
    priority: {
      batchSize: 6,
      batchDelay: 0, // Load immediately
    },
    secondary: {
      batchSize: 6,
      batchDelay: 200, // Slight delay to prioritize above-fold content
    },
  },

  // Detail Page Image Loading
  detailPreloader: {
    priorityRange: { start: 0, end: 3 },
    secondaryRange: { start: 3, end: 12 },
    remainingStart: 12,
    batches: {
      priority: { size: 3, delay: 0 },
      secondary: { size: 3, delay: 100 },
      remaining: { size: 5, delay: 300 },
    },
  },

  // Aggressive Background Prefetch
  aggressivePrefetch: {
    initialDelay: 2000, // Wait for initial render
    batches: [
      { start: 0, end: 6, delay: 0, name: 'Priority' },
      { start: 6, end: 18, delay: 1000, name: 'Secondary' },
      { start: 18, end: Infinity, delay: 3000, name: 'Tertiary' },
    ],
    idleCallbackTimeout: 5000,
  },

  // Predictive Prefetch Scoring
  predictiveScoring: {
    favorited: 100,
    recentlyFavorited: 50, // Within 7 days
    viewRecency: {
      last24Hours: 80,
      last3Days: 50,
      lastWeek: 30,
      lastMonth: 10,
    },
    viewCountMultiplier: 2,
    viewCountMax: 40,
    publicationRecency: {
      lastWeek: 25,
      lastMonth: 10,
    },
    activeStatus: 30,
    topPredictions: 3,
    prefetchDelay: 1000,
    staggerDelay: 100,
  },

  // Viewport Intersection Detection
  viewport: {
    /**
     * Library grid viewport settings
     * 200px margin preloads cards before they enter viewport
     */
    library: {
      rootMargin: '200px',
      threshold: 0,
    },
    /**
     * Detail page viewport settings
     * Larger margin for smoother scrolling experience
     */
    detail: {
      rootMargin: '400px',
      threshold: 0,
    },
  },

  // Data Query Filters
  filters: {
    /**
     * Book statuses to exclude from library view
     * - 'draft': Books that are not yet ready for publication
     * 
     * Note: All other statuses are shown (active, queued, expired)
     * to provide a complete library view of all published content
     */
    excludedStatuses: ['draft'] as const,
  },
} as const;

/**
 * Type helper to extract configuration values
 */
export type LibraryConfig = typeof LIBRARY_CONFIG;
