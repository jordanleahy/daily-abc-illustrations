/**
 * Image optimization utilities for format detection and URL generation
 */

export type SupportedImageFormat = 'avif' | 'webp' | 'png' | 'jpg';

/**
 * Detects browser support for modern image formats
 * Returns formats in priority order (best to worst)
 */
export function getSupportedImageFormat(): SupportedImageFormat[] {
  const formats: SupportedImageFormat[] = [];
  
  // Check AVIF support
  if (supportsImageFormat('avif')) {
    formats.push('avif');
  }
  
  // Check WebP support  
  if (supportsImageFormat('webp')) {
    formats.push('webp');
  }
  
  // Always include PNG and JPG as fallbacks
  formats.push('png', 'jpg');
  
  return formats;
}

/**
 * Checks if browser supports a specific image format
 */
function supportsImageFormat(format: string): boolean {
  if (typeof document === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const dataUrl = canvas.toDataURL(`image/${format}`);
    return dataUrl.startsWith(`data:image/${format}`);
  } catch {
    return false;
  }
}

/**
 * Builds optimized image URL with format parameters
 * For Supabase Storage, we'll append format parameters that can be processed by edge functions
 */
export function buildOptimizedImageUrl(
  originalUrl: string, 
  format: SupportedImageFormat,
  width?: number,
  quality: number = 80
): string {
  if (!originalUrl) return originalUrl;
  
  try {
    const url = new URL(originalUrl);
    
    // Add format optimization parameters
    url.searchParams.set('format', format);
    url.searchParams.set('quality', quality.toString());
    
    if (width) {
      url.searchParams.set('width', width.toString());
    }
    
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return originalUrl;
  }
}

/**
 * Generates multiple image URLs for different formats and sizes
 * Useful for srcset generation
 */
export function generateImageVariants(
  originalUrl: string,
  widths: number[] = [400, 800, 1200],
  quality: number = 80
): { format: SupportedImageFormat; width: number; url: string }[] {
  const supportedFormats = getSupportedImageFormat();
  const variants: { format: SupportedImageFormat; width: number; url: string }[] = [];
  
  supportedFormats.forEach(format => {
    widths.forEach(width => {
      const url = buildOptimizedImageUrl(originalUrl, format, width, quality);
      variants.push({ format, width, url });
    });
  });
  
  return variants;
}

/**
 * Gets the appropriate image format for the current browser
 * Returns the best supported format
 */
export function getBestImageFormat(): SupportedImageFormat {
  const formats = getSupportedImageFormat();
  return formats[0] || 'png';
}

/**
 * Estimates file size reduction for different formats
 * Based on typical compression ratios
 */
export function getFormatCompressionRatio(format: SupportedImageFormat): number {
  const ratios = {
    avif: 0.3,  // ~70% smaller than PNG
    webp: 0.5,  // ~50% smaller than PNG  
    jpg: 0.7,   // ~30% smaller than PNG
    png: 1.0    // Baseline
  };
  
  return ratios[format] || 1.0;
}