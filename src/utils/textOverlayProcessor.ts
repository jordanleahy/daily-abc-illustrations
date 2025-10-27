import type { TextOverlayConfig } from '@/types/textOverlay';

/**
 * Load an image from a URL
 */
export const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Load a Google Font dynamically
 */
export const loadGoogleFont = async (fontFamily: string): Promise<void> => {
  // Check if font is already loaded
  if (document.fonts.check(`1em ${fontFamily}`)) {
    return;
  }

  // Create link element for Google Font
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;600;700;800&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Wait for font to load
  await document.fonts.ready;
  
  // Give it a moment to ensure it's available
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Wrap text to fit within a maximum width
 */
export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  return lines;
};

/**
 * Get the bounding box for text
 */
export const getTextBoundingBox = (
  text: string,
  config: TextOverlayConfig
): { width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
  const metrics = ctx.measureText(text);
  
  return {
    width: metrics.width,
    height: config.fontSize * 1.2, // Approximate height with some padding
  };
};

/**
 * Draw text along an arc/curve path
 */
const drawArcText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  config: TextOverlayConfig
): void => {
  // Calculate radius based on intensity
  // Lower intensity = larger radius = gentler curve
  // Higher intensity = smaller radius = tighter curve
  const baseRadius = ctx.canvas.width * (2 - (config.arcIntensity / 100));
  const radius = config.arcDirection === 'down' ? baseRadius : -baseRadius;
  
  // Measure total text width with character spacing
  const chars = text.split('');
  const spacing = config.arcCharacterSpacing;
  let totalWidth = 0;
  const charWidths: number[] = [];
  
  chars.forEach(char => {
    const width = ctx.measureText(char).width * spacing;
    charWidths.push(width);
    totalWidth += width;
  });
  
  // Calculate the arc angle span (in radians)
  const arcAngle = totalWidth / Math.abs(radius);
  const startAngle = -arcAngle / 2; // Center the text
  
  // Draw each character
  let currentAngle = startAngle;
  
  chars.forEach((char, i) => {
    const charWidth = charWidths[i];
    const charAngle = currentAngle + (charWidth / Math.abs(radius) / 2);
    
    // Calculate character position on the arc
    const x = centerX + Math.sin(charAngle) * radius;
    const y = centerY + Math.cos(charAngle) * radius;
    
    // Save canvas state
    ctx.save();
    
    // Move to character position and rotate
    ctx.translate(x, y);
    ctx.rotate(charAngle);
    
    // Draw shadow
    if (config.shadowBlur > 0) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur;
      ctx.shadowOffsetX = config.shadowOffsetX;
      ctx.shadowOffsetY = config.shadowOffsetY;
    }
    
    // Draw stroke
    if (config.strokeWidth > 0 && config.strokeColor !== 'transparent') {
      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = config.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(char, 0, 0);
    }
    
    // Draw character
    ctx.fillStyle = config.color;
    ctx.fillText(char, 0, 0);
    
    // Restore canvas state
    ctx.restore();
    
    // Move to next character position
    currentAngle += charWidth / Math.abs(radius);
  });
};

/**
 * Draw text on canvas with all styling applied
 */
export const drawTextOnCanvas = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  config: TextOverlayConfig
): void => {
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size to match image
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Draw the image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Configure text style
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
  ctx.textAlign = config.align;
  ctx.textBaseline = 'middle';
  
  // Calculate text position
  let x = canvas.width / 2;
  if (config.align === 'left') {
    x = canvas.width * 0.05;
  } else if (config.align === 'right') {
    x = canvas.width * 0.95;
  }
  
  // Calculate Y position based on config
  let y: number;
  if (config.position === 'custom') {
    y = (canvas.height * config.yOffset) / 100;
  } else if (config.position === 'top') {
    y = canvas.height * 0.22;
  } else if (config.position === 'center') {
    y = canvas.height * 0.5;
  } else {
    y = canvas.height * 0.85;
  }
  
  // Wrap text if needed
  const maxWidth = canvas.width * 0.9;
  const lines = wrapText(ctx, config.text, maxWidth);
  const lineHeight = config.fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  // Draw full-width background overlay if enabled
  if (config.backgroundOverlay) {
    // Calculate actual text height
    const totalTextHeight = lines.length * lineHeight;
    
    // Calculate vertical padding with multiplier
    const paddingMultiplier = config.backgroundPaddingMultiplier ?? 1.0;
    const verticalPadding = Math.max(totalTextHeight * 0.2, 15) * paddingMultiplier;
    
    // Background dimensions - full width, proportional height
    const bgWidth = canvas.width;
    const bgHeight = totalTextHeight + (verticalPadding * 2);
    
    // Background position - always full width from left edge
    const bgX = 0;
    const bgY = startY - (lineHeight / 2) - verticalPadding;
    
    // Draw full-width background with boundary constraints
    ctx.fillStyle = `rgba(0, 0, 0, ${config.backgroundOpacity})`;
    ctx.fillRect(
      bgX,
      Math.max(0, bgY),
      bgWidth,
      Math.min(bgHeight, canvas.height - Math.max(0, bgY))
    );
  }
  
  // Draw each line
  lines.forEach((line, index) => {
    const lineY = startY + (index * lineHeight);
    
    if (config.arcEnabled) {
      // Use arc text drawing
      drawArcText(ctx, line, x, lineY, config);
    } else {
      // Use straight text drawing
      // Draw shadow
      if (config.shadowBlur > 0) {
        ctx.save();
        ctx.shadowColor = config.shadowColor;
        ctx.shadowBlur = config.shadowBlur;
        ctx.shadowOffsetX = config.shadowOffsetX;
        ctx.shadowOffsetY = config.shadowOffsetY;
        ctx.fillStyle = config.color;
        ctx.fillText(line, x, lineY);
        ctx.restore();
      }
      
      // Draw stroke
      if (config.strokeWidth > 0 && config.strokeColor !== 'transparent') {
        ctx.strokeStyle = config.strokeColor;
        ctx.lineWidth = config.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, x, lineY);
      }
      
      // Draw text
      ctx.fillStyle = config.color;
      ctx.fillText(line, x, lineY);
    }
  });
};

/**
 * Create a text overlay on an image and return as Blob
 */
export const createTextOverlay = async (
  imageUrl: string,
  config: TextOverlayConfig
): Promise<Blob> => {
  // Load Google Font if needed
  const systemFonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier', 'Verdana'];
  if (!systemFonts.includes(config.fontFamily)) {
    await loadGoogleFont(config.fontFamily);
  }
  
  // Load the image
  const image = await loadImageFromUrl(imageUrl);
  
  // Create canvas and draw
  const canvas = document.createElement('canvas');
  drawTextOnCanvas(canvas, image, config);
  
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
      'image/webp',
      0.85
    );
  });
};
