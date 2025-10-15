/**
 * Image optimization utilities for Supabase Storage
 * Applies transformations for performance and responsive images
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
}

/**
 * Detect browser support for modern image formats
 */
const supportsWebP = (() => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
})();

const supportsAVIF = (() => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
  return false;
})();

/**
 * Optimize a Supabase storage image URL with transformations
 * Automatically uses the best format supported by the browser
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string | undefined {
  if (!url || !url.includes('supabase.co/storage')) return url || undefined;
  
  const { width, quality = 80, format } = options;
  
  // Auto-select best format if not specified
  const selectedFormat = format || (supportsAVIF ? 'avif' : supportsWebP ? 'webp' : 'origin');
  
  const params = new URLSearchParams();
  if (width) params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('format', selectedFormat);
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Generate responsive image srcset for Supabase images
 */
export function generateSrcSet(
  url: string | null | undefined,
  sizes: number[] = [600, 800, 1200]
): string | undefined {
  if (!url || !url.includes('supabase.co/storage')) return undefined;
  
  return sizes
    .map(size => `${optimizeImageUrl(url, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Generate a tiny blur placeholder (LQIP) for progressive loading
 */
export function generateBlurPlaceholder(
  url: string | null | undefined
): string | undefined {
  if (!url || !url.includes('supabase.co/storage')) return url || undefined;
  
  return optimizeImageUrl(url, { width: 20, quality: 20, format: 'webp' });
}

/**
 * Preload critical images for instant display
 */
export function preloadImages(urls: (string | null | undefined)[], priority: 'high' | 'low' = 'high') {
  urls.filter(Boolean).forEach(url => {
    if (!url) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizeImageUrl(url, { width: 600 }) || url;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  });
}
