/**
 * Image Text Compositor
 * Composites text overlay onto an image using canvas
 * Matches the CSS styling from TextOverlay component: bg-black/60, white text, font-semibold text-lg
 * 
 * Optimized: Uses createImageBitmap() for faster, more memory-efficient image processing
 * Enhanced: Dynamic font scaling to fit all text within fixed bar height
 */

// Configuration constants
const MIN_FONT_SIZE_RATIO = 0.4; // Min font = 40% of initial
const LINE_HEIGHT_MULTIPLIER = 1.15; // Tighter spacing for multi-line
const VERTICAL_PADDING = 8; // Pixels of padding inside bar (scaled)
const FONT_SIZE_STEP = 2; // Reduce font by this amount each iteration

export interface CompositeOptions {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  barHeight?: number;
  barOpacity?: number;
}

interface FitResult {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

/**
 * Iteratively reduces font size until all text fits within the bar height.
 * Returns the optimal font size, wrapped lines, and line height.
 */
function fitTextInBar(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  barHeight: number,
  initialFontSize: number,
  minFontSize: number,
  fontWeight: number
): FitResult {
  let fontSize = initialFontSize;
  
  while (fontSize >= minFontSize) {
    // Set font for accurate measurement
    ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`;
    
    const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
    const availableHeight = barHeight - (VERTICAL_PADDING * 2);
    const maxLines = Math.floor(availableHeight / lineHeight);
    
    // Wrap text without any line limit
    const lines = wrapText(ctx, text, maxWidth);
    
    // Check if text fits
    if (lines.length <= maxLines) {
      return { lines, fontSize, lineHeight };
    }
    
    // Reduce font size and try again
    fontSize -= FONT_SIZE_STEP;
  }
  
  // At minimum font size - truncate with ellipsis if still too long
  ctx.font = `${fontWeight} ${minFontSize}px system-ui, -apple-system, sans-serif`;
  const lineHeight = minFontSize * LINE_HEIGHT_MULTIPLIER;
  const availableHeight = barHeight - (VERTICAL_PADDING * 2);
  const maxLines = Math.floor(availableHeight / lineHeight);
  
  let lines = wrapText(ctx, text, maxWidth);
  
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    // Truncate last line with ellipsis
    const lastLine = lines[maxLines - 1];
    lines[maxLines - 1] = truncateWithEllipsis(ctx, lastLine, maxWidth);
  }
  
  return { lines, fontSize: minFontSize, lineHeight };
}

/**
 * Truncates a line of text with ellipsis to fit within maxWidth
 */
function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  const targetWidth = maxWidth - ellipsisWidth;
  
  let truncated = text;
  while (ctx.measureText(truncated).width > targetWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1).trimEnd();
  }
  
  return truncated + ellipsis;
}

/**
 * Composites text onto an image with a semi-transparent black bar at the bottom
 * Accepts a Blob directly for better performance (no base64 conversion needed)
 * Returns the composited image as a Blob
 */
export async function compositeTextOnImage(
  imageBlob: Blob,
  text: string,
  options: Partial<CompositeOptions> = {}
): Promise<Blob> {
  const {
    fontSize = 24,
    fontWeight = 600,
    barHeight = 60,
    barOpacity = 0.6,
  } = options;

  // Use createImageBitmap for faster, more memory-efficient image loading
  const imageBitmap = await createImageBitmap(imageBlob);
  
  // Create canvas with image dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    imageBitmap.close();
    throw new Error('Failed to get canvas 2d context');
  }
  
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  
  // Draw the original image
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Release the ImageBitmap memory immediately after drawing
  imageBitmap.close();
  
  // Calculate bar dimensions (scale based on image size)
  const scaleFactor = canvas.width / 400; // Base scale on 400px reference width
  const scaledBarHeight = Math.max(40, barHeight * scaleFactor);
  const scaledFontSize = Math.max(16, fontSize * scaleFactor);
  const scaledMinFontSize = Math.max(10, scaledFontSize * MIN_FONT_SIZE_RATIO);
  
  // Draw semi-transparent black bar at bottom
  ctx.fillStyle = `rgba(0, 0, 0, ${barOpacity})`;
  ctx.fillRect(0, canvas.height - scaledBarHeight, canvas.width, scaledBarHeight);
  
  // Calculate text constraints
  const maxWidth = canvas.width * 0.9;
  
  // Fit text within bar using dynamic font sizing
  const { lines, fontSize: fittedFontSize, lineHeight } = fitTextInBar(
    ctx,
    text,
    maxWidth,
    scaledBarHeight,
    scaledFontSize,
    scaledMinFontSize,
    fontWeight
  );
  
  // Set final font for drawing
  ctx.fillStyle = 'white';
  ctx.font = `${fontWeight} ${fittedFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate text position (centered in bar)
  const textX = canvas.width / 2;
  const barTop = canvas.height - scaledBarHeight;
  
  // Draw text with slight shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Calculate vertical centering for all lines
  const totalTextHeight = lines.length * lineHeight;
  const startY = barTop + (scaledBarHeight - totalTextHeight) / 2 + (lineHeight / 2);
  
  lines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + (index * lineHeight));
  });
  
  // Convert to blob directly (no intermediate dataUrl)
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
 * Wrap text to fit within maxWidth (no line limit - handled by fitTextInBar)
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
