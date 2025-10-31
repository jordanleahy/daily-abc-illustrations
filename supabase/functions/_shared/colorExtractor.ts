/**
 * Color Extraction and Formatting Utilities
 * Extracts and formats colors from style guide JSON for consistent use across all image generation
 */

export interface ColorDefinition {
  hex: string;
  hsl: string;
  usage: string;
}

export interface ExtractedColors {
  primary: ColorDefinition;
  secondary: ColorDefinition;
  accent: ColorDefinition;
  background: ColorDefinition;
  text?: ColorDefinition;
  supporting?: ColorDefinition;
}

/**
 * Extract colors from style guide JSON
 * Returns null if colorPalette is missing or malformed
 */
export function extractColorsFromStyleGuide(styleGuideJSON: any): ExtractedColors | null {
  if (!styleGuideJSON || !styleGuideJSON.colorPalette) {
    return null;
  }
  
  const palette = styleGuideJSON.colorPalette;
  
  // Validate required colors exist
  if (!palette.primary || !palette.secondary || !palette.accent || !palette.background) {
    return null;
  }
  
  return {
    primary: {
      hex: palette.primary.hex || '#000000',
      hsl: palette.primary.hsl || 'hsl(0, 0%, 0%)',
      usage: palette.primary.usage || 'main elements'
    },
    secondary: {
      hex: palette.secondary.hex || '#666666',
      hsl: palette.secondary.hsl || 'hsl(0, 0%, 40%)',
      usage: palette.secondary.usage || 'secondary elements'
    },
    accent: {
      hex: palette.accent.hex || '#FF5733',
      hsl: palette.accent.hsl || 'hsl(9, 100%, 60%)',
      usage: palette.accent.usage || 'highlights'
    },
    background: {
      hex: palette.background.hex || '#FFFFFF',
      hsl: palette.background.hsl || 'hsl(0, 0%, 100%)',
      usage: palette.background.usage || 'background'
    },
    text: palette.text ? {
      hex: palette.text.hex || '#000000',
      hsl: palette.text.hsl || 'hsl(0, 0%, 0%)',
      usage: palette.text.usage || 'text content'
    } : undefined,
    supporting: palette.supporting ? {
      hex: palette.supporting.hex,
      hsl: palette.supporting.hsl,
      usage: palette.supporting.usage || 'supporting elements'
    } : undefined
  };
}

/**
 * Generate color enforcement instructions for AI prompts
 * These are mandatory instructions that lock color palette WITHOUT showing hex values as text
 */
export function generateColorEnforcementInstructions(colors: ExtractedColors): string {
  return `
🎨 MANDATORY COLOR PALETTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the style guide's defined color palette with these roles:
- PRIMARY: ${colors.primary.usage}
- SECONDARY: ${colors.secondary.usage}
- ACCENT: ${colors.accent.usage}
- BACKGROUND: ${colors.background.usage}
${colors.text ? `- TEXT: ${colors.text.usage}` : ''}
${colors.supporting ? `- SUPPORTING: ${colors.supporting.usage}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL COLOR REQUIREMENTS:
1. Use the book's established color palette - do NOT show hex codes or color values as text in the image
2. Apply colors naturally to elements based on their usage roles above
3. Maintain visual consistency with the style throughout
4. Colors should be vibrant and appropriate for the target audience
5. Do NOT include any technical color codes (hex, RGB, HSL) as visible text in the image
`.trim();
}

/**
 * Validate color format (hex code)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/i.test(color);
}

/**
 * Validate all colors in extracted palette
 */
export function validateColorPalette(colors: ExtractedColors): { valid: boolean; invalidColors: string[] } {
  const invalidColors: string[] = [];
  
  if (!isValidHexColor(colors.primary.hex)) invalidColors.push('primary');
  if (!isValidHexColor(colors.secondary.hex)) invalidColors.push('secondary');
  if (!isValidHexColor(colors.accent.hex)) invalidColors.push('accent');
  if (!isValidHexColor(colors.background.hex)) invalidColors.push('background');
  if (colors.text && !isValidHexColor(colors.text.hex)) invalidColors.push('text');
  if (colors.supporting && !isValidHexColor(colors.supporting.hex)) invalidColors.push('supporting');
  
  return {
    valid: invalidColors.length === 0,
    invalidColors
  };
}
