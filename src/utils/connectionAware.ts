/**
 * Connection-aware utilities for adaptive loading based on network quality
 */

export type ConnectionQuality = 'high' | 'medium' | 'low';

/**
 * Detect the user's connection quality
 * Uses Network Information API when available
 */
export function getConnectionQuality(): ConnectionQuality {
  // Check if Network Information API is available
  if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      const saveData = connection.saveData;
      
      // If user has save-data enabled, treat as low quality
      if (saveData) {
        return 'low';
      }
      
      // Map effective types to quality
      switch (effectiveType) {
        case '4g':
          return 'high';
        case '3g':
          return 'medium';
        case '2g':
        case 'slow-2g':
          return 'low';
        default:
          return 'medium';
      }
    }
  }
  
  // Default to medium if API not available
  return 'medium';
}

/**
 * Get optimal image quality based on connection
 */
export function getOptimalImageQuality(connectionQuality?: ConnectionQuality): number {
  const quality = connectionQuality || getConnectionQuality();
  
  switch (quality) {
    case 'high':
      return 85;
    case 'medium':
      return 75;
    case 'low':
      return 60;
    default:
      return 75;
  }
}

/**
 * Get optimal image width based on connection
 */
export function getOptimalImageWidth(baseWidth: number, connectionQuality?: ConnectionQuality): number {
  const quality = connectionQuality || getConnectionQuality();
  
  switch (quality) {
    case 'high':
      return baseWidth;
    case 'medium':
      return Math.floor(baseWidth * 0.8);
    case 'low':
      return Math.floor(baseWidth * 0.6);
    default:
      return baseWidth;
  }
}

/**
 * Determine if images should be eagerly loaded based on connection
 */
export function shouldEagerLoad(connectionQuality?: ConnectionQuality): boolean {
  const quality = connectionQuality || getConnectionQuality();
  return quality === 'high';
}

/**
 * Get image format preference based on connection
 */
export function getOptimalImageFormat(connectionQuality?: ConnectionQuality): 'avif' | 'webp' | 'origin' {
  const quality = connectionQuality || getConnectionQuality();
  
  // AVIF is most efficient but may not be supported everywhere
  // WebP is a good balance
  // Origin for low quality connections to avoid conversion overhead
  switch (quality) {
    case 'high':
      return 'avif';
    case 'medium':
      return 'webp';
    case 'low':
      return 'webp'; // WebP is still more efficient than origin
    default:
      return 'webp';
  }
}

/**
 * Subscribe to connection changes
 */
export function onConnectionChange(callback: (quality: ConnectionQuality) => void): () => void {
  if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const handler = () => callback(getConnectionQuality());
      connection.addEventListener('change', handler);
      
      return () => connection.removeEventListener('change', handler);
    }
  }
  
  // Return noop cleanup function if API not available
  return () => {};
}
