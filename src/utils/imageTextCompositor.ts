/**
 * Image Text Compositor
 * Composites text overlay onto an image using canvas
 * Matches the CSS styling from TextOverlay component: bg-black/60, white text, font-semibold text-lg
 */

export interface CompositeOptions {
  text: string;
  fontSize?: number;
  fontWeight?: number;
  barHeight?: number;
  barOpacity?: number;
}

/**
 * Load an image from a data URL or regular URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

/**
 * Composites text onto an image with a semi-transparent black bar at the bottom
 * Returns the composited image as both a data URL and Blob
 */
export async function compositeTextOnImage(
  imageDataUrl: string,
  text: string,
  options: Partial<CompositeOptions> = {}
): Promise<{ dataUrl: string; blob: Blob }> {
  const {
    fontSize = 24,
    fontWeight = 600,
    barHeight = 60,
    barOpacity = 0.6,
  } = options;

  // Load the source image
  const img = await loadImage(imageDataUrl);
  
  // Create canvas with image dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw the original image
  ctx.drawImage(img, 0, 0);
  
  // Calculate bar dimensions (scale based on image size)
  const scaleFactor = img.width / 400; // Base scale on 400px reference width
  const scaledBarHeight = Math.max(40, barHeight * scaleFactor);
  const scaledFontSize = Math.max(16, fontSize * scaleFactor);
  
  // Draw semi-transparent black bar at bottom
  ctx.fillStyle = `rgba(0, 0, 0, ${barOpacity})`;
  ctx.fillRect(0, img.height - scaledBarHeight, img.width, scaledBarHeight);
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = `${fontWeight} ${scaledFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate text position (centered in bar)
  const textX = img.width / 2;
  const textY = img.height - (scaledBarHeight / 2);
  
  // Draw text with slight shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Wrap text if too long
  const maxWidth = img.width * 0.9;
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
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            blob,
          });
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
