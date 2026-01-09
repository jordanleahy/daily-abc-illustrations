/**
 * Coloring Page Compositor
 * Composites a color reference image onto a B&W coloring page
 * Places color image as a 15% thumbnail in the top-left corner
 */

export interface CompositeColoringPageOptions {
  /** Size of color thumbnail as percentage of B&W image width (default: 0.15 = 15%) */
  thumbnailScale?: number;
  /** Padding from edges in pixels (scaled with image) */
  padding?: number;
  /** Border width around thumbnail */
  borderWidth?: number;
  /** Border color */
  borderColor?: string;
  /** Shadow blur radius */
  shadowBlur?: number;
  /** Shadow color */
  shadowColor?: string;
}

/**
 * Downloads an image from URL and returns as Blob
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Composites a color reference image onto a B&W coloring page
 * Places the color image as a small thumbnail in the top-left corner
 * 
 * @param bwImageSource - B&W coloring image (Blob or URL)
 * @param colorImageSource - Color reference image (Blob or URL)
 * @param options - Compositing options
 * @returns Composited image as Blob
 */
export async function compositeColoringPage(
  bwImageSource: Blob | string,
  colorImageSource: Blob | string,
  options: CompositeColoringPageOptions = {}
): Promise<Blob> {
  const {
    thumbnailScale = 0.15,
    padding = 15,
    borderWidth = 3,
    borderColor = '#333333',
    shadowBlur = 8,
    shadowColor = 'rgba(0, 0, 0, 0.3)',
  } = options;

  // Fetch images if URLs provided
  const bwBlob = typeof bwImageSource === 'string' 
    ? await fetchImageAsBlob(bwImageSource) 
    : bwImageSource;
  const colorBlob = typeof colorImageSource === 'string' 
    ? await fetchImageAsBlob(colorImageSource) 
    : colorImageSource;

  // Load images using createImageBitmap for efficiency
  const [bwBitmap, colorBitmap] = await Promise.all([
    createImageBitmap(bwBlob),
    createImageBitmap(colorBlob),
  ]);

  // Create canvas with B&W image dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    bwBitmap.close();
    colorBitmap.close();
    throw new Error('Failed to get canvas 2d context');
  }

  canvas.width = bwBitmap.width;
  canvas.height = bwBitmap.height;

  // Draw B&W image as base layer
  ctx.drawImage(bwBitmap, 0, 0);

  // Calculate thumbnail dimensions (15% of B&W width, maintain aspect ratio)
  const thumbnailWidth = Math.round(canvas.width * thumbnailScale);
  const thumbnailHeight = Math.round(
    (colorBitmap.height / colorBitmap.width) * thumbnailWidth
  );

  // Scale padding based on image size
  const scaleFactor = canvas.width / 800; // Base scale on 800px reference
  const scaledPadding = Math.round(padding * scaleFactor);
  const scaledBorderWidth = Math.max(2, Math.round(borderWidth * scaleFactor));
  const scaledShadowBlur = Math.round(shadowBlur * scaleFactor);

  // Position in top-left with padding
  const thumbnailX = scaledPadding;
  const thumbnailY = scaledPadding;

  // Draw shadow
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = scaledShadowBlur;
  ctx.shadowOffsetX = 2 * scaleFactor;
  ctx.shadowOffsetY = 2 * scaleFactor;

  // Draw white background for thumbnail (in case of transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    thumbnailX - scaledBorderWidth,
    thumbnailY - scaledBorderWidth,
    thumbnailWidth + scaledBorderWidth * 2,
    thumbnailHeight + scaledBorderWidth * 2
  );
  ctx.restore();

  // Draw border
  ctx.fillStyle = borderColor;
  ctx.fillRect(
    thumbnailX - scaledBorderWidth,
    thumbnailY - scaledBorderWidth,
    thumbnailWidth + scaledBorderWidth * 2,
    thumbnailHeight + scaledBorderWidth * 2
  );

  // Draw color thumbnail
  ctx.drawImage(
    colorBitmap,
    thumbnailX,
    thumbnailY,
    thumbnailWidth,
    thumbnailHeight
  );

  // Release bitmap memory
  bwBitmap.close();
  colorBitmap.close();

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Batch process multiple coloring pages
 * Useful for processing entire books
 */
export async function batchCompositeColoringPages(
  pages: Array<{
    bwImageUrl: string;
    colorImageUrl: string;
    pageId: string;
  }>,
  options: CompositeColoringPageOptions = {},
  onProgress?: (completed: number, total: number, pageId: string) => void
): Promise<Map<string, Blob>> {
  const results = new Map<string, Blob>();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    try {
      const composited = await compositeColoringPage(
        page.bwImageUrl,
        page.colorImageUrl,
        options
      );
      results.set(page.pageId, composited);
      onProgress?.(i + 1, pages.length, page.pageId);
    } catch (error) {
      console.error(`Failed to composite page ${page.pageId}:`, error);
      // Continue with other pages
    }
  }

  return results;
}
