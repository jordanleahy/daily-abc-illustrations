/**
 * Image optimization utilities for mobile performance
 * Generates optimized Supabase image transformation URLs
 */

export interface ImageOptimizationOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
}

/**
 * Detect user's connection speed and adjust quality accordingly
 */
export function getConnectionAwareQuality(): number {
  if (typeof navigator === 'undefined') return 85;

  const connection = (navigator as any).connection;
  if (!connection) return 85;

  // Check if user has data saving enabled
  if (connection.saveData) return 65;

  // Adjust quality based on connection type
  const effectiveType = connection.effectiveType;
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 60;
    case '3g':
      return 75;
    case '4g':
    default:
      return 85;
  }
}

/**
 * Generate optimized image URL with Supabase transformation parameters
 * Includes WebP format, dynamic quality, and CDN cache optimization
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageOptimizationOptions
): string | null {
  if (!originalUrl) return null;

  try {
    const url = new URL(originalUrl);
    
    // Image transformation parameters
    url.searchParams.set('width', options.width.toString());
    url.searchParams.set('height', options.height.toString());
    url.searchParams.set('format', options.format || 'webp');
    
    // Use connection-aware quality or provided quality
    const quality = options.quality || getConnectionAwareQuality();
    url.searchParams.set('quality', quality.toString());
    
    // Cache optimization for CDN
    url.searchParams.set('cache', '31536000'); // 1 year
    url.searchParams.set('immutable', 'true');
    
    return url.toString();
  } catch (error) {
    console.error('Error generating optimized image URL:', error);
    return originalUrl;
  }
}

/**
 * Check if user is on a slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection = (navigator as any).connection;
  if (!connection) return false;

  const effectiveType = connection.effectiveType;
  return effectiveType === 'slow-2g' || effectiveType === '2g';
}

/**
 * Check if user has data saving enabled
 */
export function hasDataSavingEnabled(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection = (navigator as any).connection;
  return connection?.saveData === true;
}
