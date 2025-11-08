/**
 * Library data caching utilities
 * Stores complete library response in localStorage for instant page loads
 * Works alongside image caching and 7-day LRU cleanup system
 */

import { DailyPublishedWithBook } from '@/types/dailyPublished';

const LIBRARY_CACHE_KEY = 'library-books-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface LibraryCacheData {
  books: DailyPublishedWithBook[];
  timestamp: number;
  userId: string;
}

/**
 * Store library books in localStorage for instant loading
 */
export function cacheLibraryBooks(books: DailyPublishedWithBook[], userId: string): void {
  try {
    const cacheData: LibraryCacheData = {
      books,
      timestamp: Date.now(),
      userId
    };
    
    localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[Library Cache] Cached ${books.length} books`);
  } catch (error) {
    console.warn('[Library Cache] Failed to cache books:', error);
  }
}

/**
 * Get cached library books if still fresh
 * Returns null if cache is stale or invalid
 */
export function getCachedLibraryBooks(userId: string): DailyPublishedWithBook[] | null {
  try {
    const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
    if (!cached) return null;

    const cacheData: LibraryCacheData = JSON.parse(cached);
    
    // Validate user matches (don't show another user's cached data)
    if (cacheData.userId !== userId) {
      console.log('[Library Cache] Cache for different user, invalidating');
      localStorage.removeItem(LIBRARY_CACHE_KEY);
      return null;
    }
    
    // Check if cache is still fresh
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_DURATION) {
      console.log('[Library Cache] Cache expired, will refresh');
      return null;
    }
    
    console.log(`[Library Cache] Using cached data (${Math.round(age / 1000)}s old)`);
    return cacheData.books;
  } catch (error) {
    console.warn('[Library Cache] Failed to read cache:', error);
    return null;
  }
}

/**
 * Clear library cache (useful for force refresh or logout)
 */
export function clearLibraryCache(): void {
  try {
    localStorage.removeItem(LIBRARY_CACHE_KEY);
    console.log('[Library Cache] Cache cleared');
  } catch (error) {
    console.warn('[Library Cache] Failed to clear cache:', error);
  }
}

/**
 * Get cache age in seconds
 */
export function getLibraryCacheAge(userId: string): number | null {
  try {
    const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
    if (!cached) return null;

    const cacheData: LibraryCacheData = JSON.parse(cached);
    if (cacheData.userId !== userId) return null;
    
    return Math.round((Date.now() - cacheData.timestamp) / 1000);
  } catch {
    return null;
  }
}
