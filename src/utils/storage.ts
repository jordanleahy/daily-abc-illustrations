interface StorageItem<T> {
  data: T;
  expiresAt: number;
}

export class SafeLocalStorage {
  /**
   * Set an item in localStorage with expiration
   */
  static set<T>(key: string, value: T, expirationHours: number): void {
    try {
      const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000);
      const item: StorageItem<T> = {
        data: value,
        expiresAt
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get an item from localStorage, returns null if expired or not found
   */
  static get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item: StorageItem<T> = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Get expiration info for an item
   */
  static getExpiration(key: string): { expiresAt: number; timeLeft: number } | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item: StorageItem<any> = JSON.parse(itemStr);
      const timeLeft = item.expiresAt - Date.now();
      
      return {
        expiresAt: item.expiresAt,
        timeLeft: timeLeft > 0 ? timeLeft : 0
      };
    } catch (error) {
      return null;
    }
  }
}

// Subscription caching constants
export const SUBSCRIPTION_CACHE_KEY = 'subscription_status';
export const SUBSCRIPTION_CACHE_DAYS = 90; // 90-day cache for game app

// Role caching constants  
export const ROLE_CACHE_KEY = 'user_roles_cache';
export const ROLE_CACHE_DAYS = 90;

// Unified access state caching
export const ACCESS_STATE_CACHE_KEY = 'access_state_cache';
export const ACCESS_STATE_CACHE_HOURS = 90 * 24; // 90 days in hours

// Habits caching constants
export const TODAY_HABITS_CACHE_KEY = 'today_habits_cache';
export const TODAY_HABITS_CACHE_HOURS = 4; // 4-hour cache for habits

// Kid profiles caching constants
export const KID_PROFILES_CACHE_KEY = 'kid_profiles_cache';
export const KID_PROFILES_CACHE_DAYS = 90; // 90-day cache for stable kid profile data

// Visitor tracking for non-authenticated users
const VISITOR_ID_KEY = 'visitor_id';
const VISITOR_STATS_KEY = 'visitor_stats';
const VISITOR_BOOKS_KEY = 'visitor_books';

interface VisitorStats {
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  totalBooksRead: number;
}

interface BookReadingStats {
  [bookId: string]: {
    readCount: number;
    lastRead: number;
    completionCount: number;
    highestPageReached: number;
  };
}

/**
 * Get or create a persistent visitor ID for anonymous users
 */
export const getOrCreateVisitorId = (): string => {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch (error) {
    console.warn('Failed to get/create visitor ID:', error);
    return `temp_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Track a visit for anonymous users
 */
export const trackVisit = (): VisitorStats => {
  try {
    const stored = localStorage.getItem(VISITOR_STATS_KEY);
    const stats: VisitorStats = stored ? JSON.parse(stored) : {
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      visitCount: 0,
      totalBooksRead: 0,
    };

    stats.lastVisit = Date.now();
    stats.visitCount += 1;

    localStorage.setItem(VISITOR_STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.warn('Failed to track visit:', error);
    return {
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      visitCount: 1,
      totalBooksRead: 0,
    };
  }
};

/**
 * Get visitor statistics
 */
export const getVisitorStats = (): VisitorStats | null => {
  try {
    const stored = localStorage.getItem(VISITOR_STATS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to get visitor stats:', error);
    return null;
  }
};

/**
 * Track book reading for anonymous users
 */
export const trackBookReading = (bookId: string, highestPageReached: number, isCompleted: boolean = false): void => {
  try {
    const stored = localStorage.getItem(VISITOR_BOOKS_KEY);
    const books: BookReadingStats = stored ? JSON.parse(stored) : {};

    if (!books[bookId]) {
      books[bookId] = {
        readCount: 0,
        lastRead: Date.now(),
        completionCount: 0,
        highestPageReached: 0,
      };
    }

    books[bookId].readCount += 1;
    books[bookId].lastRead = Date.now();
    books[bookId].highestPageReached = Math.max(books[bookId].highestPageReached, highestPageReached);
    
    if (isCompleted) {
      books[bookId].completionCount += 1;
    }

    localStorage.setItem(VISITOR_BOOKS_KEY, JSON.stringify(books));

    // Update total books read count
    const stats = getVisitorStats();
    if (stats) {
      stats.totalBooksRead = Object.keys(books).length;
      localStorage.setItem(VISITOR_STATS_KEY, JSON.stringify(stats));
    }
  } catch (error) {
    console.warn('Failed to track book reading:', error);
  }
};

/**
 * Get reading stats for a specific book
 */
export const getBookReadingStats = (bookId: string) => {
  try {
    const stored = localStorage.getItem(VISITOR_BOOKS_KEY);
    const books: BookReadingStats = stored ? JSON.parse(stored) : {};
    return books[bookId] || null;
  } catch (error) {
    console.warn('Failed to get book reading stats:', error);
    return null;
  }
};

/**
 * Get all book reading stats
 */
export const getAllBookReadingStats = (): BookReadingStats => {
  try {
    const stored = localStorage.getItem(VISITOR_BOOKS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to get all book reading stats:', error);
    return {};
  }
};
