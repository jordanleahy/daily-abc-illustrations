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
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return true; // SSR default
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
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
 * Converts Supabase storage URLs to use the render/image endpoint for transformations
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageOptimizationOptions
): string | null {
  if (!originalUrl) return null;

  try {
    const url = new URL(originalUrl);
    
    // Check if this is a Supabase storage URL
    if (!url.hostname.includes('supabase.co')) {
      return originalUrl; // Not a Supabase URL, return as-is
    }
    
    // Transform /storage/v1/object/public/ to /storage/v1/render/image/public/
    const path = url.pathname;
    if (!path.includes('/storage/v1/object/public/')) {
      return originalUrl; // Not a standard Supabase storage path
    }
    
    // Replace object endpoint with render/image endpoint
    const transformedPath = path.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    
    // Build new URL with transformation parameters
    const transformedUrl = new URL(transformedPath, url.origin);
    
    // Add image transformation parameters
    transformedUrl.searchParams.set('width', options.width.toString());
    transformedUrl.searchParams.set('height', options.height.toString());
    transformedUrl.searchParams.set('resize', 'cover'); // Cover for square crops
    
    // Use WebP if supported, otherwise fallback to JPEG
    const format = options.format || (supportsWebP() ? 'webp' : 'jpeg');
    transformedUrl.searchParams.set('format', format);
    
    // Use connection-aware quality
    const quality = options.quality || getConnectionAwareQuality();
    transformedUrl.searchParams.set('quality', quality.toString());
    
    return transformedUrl.toString();
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
