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
export const SUBSCRIPTION_CACHE_DAYS = 30;
