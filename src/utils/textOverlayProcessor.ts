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
  // Set text properties for arc rendering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate radius: smaller intensity = tighter curve
  // Range: 200-2000 pixels provides good visual range
  const radius = 200 + (config.arcIntensity * 18);
  const arcDirection = config.arcDirection === 'down' ? 1 : -1;
  const finalRadius = radius * arcDirection;
  
  // Measure text and calculate arc span
  const chars = text.split('');
  const spacing = config.arcCharacterSpacing ?? 1.1;
  
  // Calculate total arc angle
  let totalWidth = 0;
  const charWidths = chars.map(char => {
    const width = ctx.measureText(char).width * spacing;
    totalWidth += width;
    return width;
  });
  
  const arcAngle = totalWidth / radius;
  let currentAngle = -arcAngle / 2;
  
  // Draw each character
  chars.forEach((char, i) => {
    // Calculate angle for this character's center
    const charAngle = currentAngle + (charWidths[i] / radius / 2);
    
    // Calculate position on arc
    const x = centerX + Math.cos(charAngle - Math.PI / 2) * finalRadius;
    const y = centerY + Math.sin(charAngle - Math.PI / 2) * finalRadius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle);
    
    // Draw stroke first (no shadow on stroke to avoid artifacts)
    if (config.strokeWidth > 0 && config.strokeColor !== 'transparent') {
      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = config.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(char, 0, 0);
    }
    
    // Draw fill with shadow
    ctx.fillStyle = config.color;
    if (config.shadowBlur > 0) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur;
      ctx.shadowOffsetX = config.shadowOffsetX;
      ctx.shadowOffsetY = config.shadowOffsetY;
    }
    ctx.fillText(char, 0, 0);
    
    ctx.restore();
    
    // Advance to next character
    currentAngle += charWidths[i] / radius;
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
  
  // Wrap text if needed (but not for arc text - arcs work best with single lines)
  const maxWidth = canvas.width * 0.9;
  const lines = config.arcEnabled 
    ? [config.text] // Force single line for arc text
    : wrapText(ctx, config.text, maxWidth); // Normal wrapping for straight text
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
      // Arc text is always centered horizontally
      const centerX = canvas.width / 2;
      drawArcText(ctx, line, centerX, lineY, config);
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
