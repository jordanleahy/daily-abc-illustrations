/**
 * Client-side image processing utilities
 * Compresses and resizes images before upload to reduce file size and improve performance
 */

export interface ImageProcessingOptions {
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Target file size in bytes (will reduce quality to reach this) */
  targetSizeBytes?: number;
  /** Initial quality (0-1) */
  quality?: number;
  /** Output format */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface ProcessedImage {
  /** Compressed image as a Blob */
  blob: Blob;
  /** Data URL for preview */
  dataUrl: string;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Compression ratio (0-1) */
  compressionRatio: number;
  /** Final dimensions */
  width: number;
  height: number;
}

/**
 * Check if the browser supports WebP format
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Resize and compress an image file
 * @param file - Original image file
 * @param options - Processing options
 * @returns Processed image with metadata
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    targetSizeBytes = 500 * 1024, // 500KB
    quality = 0.85,
    format = supportsWebP() ? 'image/webp' : 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // Load the image
  const img = await loadImageFromFile(file);

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Try to compress to target size by reducing quality
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, format, currentQuality);

  // If still too large, progressively reduce quality
  const minQuality = 0.6;
  const qualityStep = 0.05;

  while (blob.size > targetSizeBytes && currentQuality > minQuality) {
    currentQuality -= qualityStep;
    blob = await canvasToBlob(canvas, format, currentQuality);
  }

  // Create data URL for preview
  const dataUrl = await blobToDataUrl(blob);

  return {
    blob,
    dataUrl,
    originalSize,
    compressedSize: blob.size,
    compressionRatio: blob.size / originalSize,
    width,
    height,
  };
}

/**
 * Load an image from a file
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  } else {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
