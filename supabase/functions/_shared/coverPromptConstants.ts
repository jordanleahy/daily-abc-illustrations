/**
 * Centralized Cover Page Prompt Constants
 * 
 * Single source of truth for cover page image generation prompts.
 * All cover-related prompt logic should import from this file.
 */

// ============================================================================
// CORE CONSTANTS
// ============================================================================

/**
 * The canonical instruction for displaying book titles on cover pages.
 * This MUST be used consistently across all cover generation functions.
 */
export const COVER_TITLE_INSTRUCTION = 
  'CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.';

/**
 * Strong negative prompt for content pages (NOT for cover pages)
 */
export const NO_TEXT_INSTRUCTION = 
  'No text overlays. DO NOT add any text, labels, signs, words, letters, captions, or written content. Clean illustration only.';

/**
 * Aspect ratio instructions for different cover formats
 */
export const COVER_ASPECT_RATIOS = {
  square: 'CRITICAL - IMAGE DIMENSIONS: Generate a SQUARE image with 1:1 aspect ratio. The width and height MUST be equal. This is mandatory.',
  landscape: 'CRITICAL - IMAGE DIMENSIONS: Generate a landscape image at 1200x630 ratio for optimal thumbnail and social media display.',
  portrait: 'CRITICAL - IMAGE DIMENSIONS: Generate a portrait image with 3:4 aspect ratio.',
} as const;

/**
 * Default styling constants for cover pages
 */
export const COVER_STYLE_DEFAULTS = {
  backgroundColor: 'simple solid color or gentle gradient',
  decorativeElements: '4-8 small themed decorative elements around edges and corners',
  mood: 'clean, simple, and optimized for thumbnail visibility',
  fontStyle: 'bubble-letter font (rounded, playful, child-friendly)',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export interface CoverPromptConfig {
  bookTitle: string;
  characterTheme?: string;
  bookDescription?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  includeTitle?: boolean;  // false for text-overlay-later approach
}

/**
 * Generates the cover title instruction with the specific book title inserted.
 * Use this when you need to include the actual title in the instruction.
 * 
 * @param bookTitle - The title of the book to display
 * @returns The complete title display instruction with the title embedded
 */
export function generateCoverTitleInstruction(bookTitle: string): string {
  return `CRITICAL INSTRUCTION: Display the book title "${bookTitle}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.`;
}

/**
 * Returns the correct ending for cover page prompts.
 * Cover pages should end with the title instruction, NOT "No text overlays."
 * 
 * @returns The cover title instruction constant
 */
export function getCoverPromptEnding(): string {
  return COVER_TITLE_INSTRUCTION;
}

/**
 * Returns the correct ending for content page prompts.
 * Content pages should always end with the no-text instruction.
 * 
 * @returns The no-text instruction constant
 */
export function getContentPromptEnding(): string {
  return NO_TEXT_INSTRUCTION;
}

/**
 * Builds a complete cover prompt prefix with aspect ratio and title instructions.
 * 
 * @param config - Configuration for the cover prompt
 * @returns A prefix string to prepend to cover prompts
 */
export function buildCoverPromptPrefix(config: CoverPromptConfig): string {
  const parts: string[] = [];
  
  // Add aspect ratio instruction
  const aspectRatio = config.aspectRatio || 'square';
  parts.push(COVER_ASPECT_RATIOS[aspectRatio]);
  
  // Add title instruction if enabled
  if (config.includeTitle !== false && config.bookTitle) {
    parts.push('');  // Empty line for readability
    parts.push(generateCoverTitleInstruction(config.bookTitle));
  }
  
  return parts.join('\n');
}

/**
 * Builds a complete cover image description based on configuration.
 * Used for generating the full cover page prompt.
 * 
 * @param config - Configuration for the cover prompt
 * @returns A complete cover image description
 */
export function buildCoverPrompt(config: CoverPromptConfig): string {
  const {
    bookTitle,
    characterTheme,
    bookDescription,
    aspectRatio = 'square',
    includeTitle = true,
  } = config;
  
  const themeStyle = characterTheme && characterTheme !== 'no-theme' 
    ? `${characterTheme} style, ` 
    : '';
  
  const aspectInstruction = COVER_ASPECT_RATIOS[aspectRatio];
  
  const titleInstruction = includeTitle 
    ? generateCoverTitleInstruction(bookTitle)
    : '';
  
  return `${aspectInstruction}

A vibrant educational cover image for "${bookTitle}".

${titleInstruction}

${bookDescription ? `Theme: ${bookDescription}` : ''}

Style: ${themeStyle}Children's book illustration, soft watercolor aesthetic, warm inviting colors, playful educational theme.

Background: ${COVER_STYLE_DEFAULTS.backgroundColor}. Around the edges and corners: ${COVER_STYLE_DEFAULTS.decorativeElements}.

The design should be ${COVER_STYLE_DEFAULTS.mood}.`.trim();
}

/**
 * Determines whether a page should use the cover title instruction or the no-text instruction.
 * 
 * @param pageType - The type of page ('cover', 'content', 'educational', etc.)
 * @param pageNumber - The page number (1 = cover page)
 * @returns The appropriate prompt ending for the page type
 */
export function getPromptEndingForPage(pageType?: string, pageNumber?: number): string {
  // Cover pages (page 1 or pageType === 'cover') get title instruction
  if (pageType === 'cover' || pageNumber === 1) {
    return COVER_TITLE_INSTRUCTION;
  }
  
  // All other pages get no-text instruction
  return NO_TEXT_INSTRUCTION;
}
