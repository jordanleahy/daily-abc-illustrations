/**
 * Generates a blur data URL placeholder for images
 * Creates a tiny base64-encoded image that can be used as a blur placeholder
 */
export function generateBlurDataUrl(
  width: number = 10,
  height: number = 8,
  color: string = '#f0f0f0'
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }
  
  // Fill with the specified color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Convert to base64 data URL
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Generates a gradient blur data URL
 * Creates a simple gradient that works well as a placeholder
 */
export function generateGradientBlurDataUrl(
  width: number = 10,
  height: number = 8,
  startColor: string = '#f0f0f0',
  endColor: string = '#e0e0e0'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  
  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Gets the dominant color from an image URL and creates a blur placeholder
 * This is a simplified version - in production you might want to use a service
 */
export function createColorBasedBlurDataUrl(
  imageUrl: string, 
  defaultColor: string = '#f0f0f0'
): string {
  // For now, return a default blur - you could extend this to analyze the image
  return generateBlurDataUrl(10, 8, defaultColor);
}

/**
 * Common blur data URLs for different use cases
 */
export const commonBlurDataUrls = {
  neutral: generateBlurDataUrl(10, 8, '#f0f0f0'),
  dark: generateBlurDataUrl(10, 8, '#2a2a2a'),
  light: generateBlurDataUrl(10, 8, '#ffffff'),
  primary: generateBlurDataUrl(10, 8, '#3b82f6'),
  gradient: generateGradientBlurDataUrl(10, 8, '#f0f0f0', '#e0e0e0'),
};