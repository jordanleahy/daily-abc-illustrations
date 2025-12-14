/**
 * Image Text Compositor
 * Composites text overlay onto an image using canvas
 * Matches the CSS styling from TextOverlay component: bg-black/60, white text, font-semibold text-lg
 * 
 * Optimized: Uses createImageBitmap() for faster, more memory-efficient image processing
 */

export interface CompositeOptions {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  barHeight?: number;
  barOpacity?: number;
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
  
  // Draw semi-transparent black bar at bottom
  ctx.fillStyle = `rgba(0, 0, 0, ${barOpacity})`;
  ctx.fillRect(0, canvas.height - scaledBarHeight, canvas.width, scaledBarHeight);
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = `${fontWeight} ${scaledFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate text position (centered in bar)
  const textX = canvas.width / 2;
  const textY = canvas.height - (scaledBarHeight / 2);
  
  // Draw text with slight shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Wrap text if too long
  const maxWidth = canvas.width * 0.9;
  const lines = wrapText(ctx, text, maxWidth);
  
  if (lines.length === 1) {
    ctx.fillText(text, textX, textY);
  } else {
    // Multiple lines - adjust vertical positioning
    const lineHeight = scaledFontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = textY - (totalHeight / 2) + (lineHeight / 2);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, startY + (index * lineHeight));
    });
  }
  
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
 * Wrap text to fit within maxWidth
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
  
  // Limit to 2 lines max
  return lines.slice(0, 2);
}
