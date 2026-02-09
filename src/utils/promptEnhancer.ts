/**
 * Client-side prompt enhancer
 * 
 * Mirrors the server-side enhancements applied in generate-color-image edge function.
 * This ensures "Copy Prompt" produces the exact same enhanced prompt that "Generate" uses.
 * 
 * Enhancements applied:
 * 1. Aspect ratio prefix (square for cover/educational pages)
 * 2. Cover title instruction (for cover pages)
 * 3. Negative prompt suffix (no text in illustrations)
 * 4. Opposites split-screen rules (for opposites book content pages)
 */

// --- Constants mirrored from server-side coverPromptConstants.ts ---

const COVER_ASPECT_RATIO_SQUARE = 
  'CRITICAL - IMAGE DIMENSIONS: Generate a SQUARE image with 1:1 aspect ratio. The width and height MUST be equal. This is mandatory.';

const NEGATIVE_PROMPT = 
  'No text overlays. DO NOT add any text, labels, signs, words, letters, captions, or written content. Clean illustration only.';

const OPPOSITES_SPLIT_SCREEN_RULES = `
--- CRITICAL SPLIT-SCREEN COMPOSITION FOR OPPOSITES ---

**MANDATORY FULL-HEIGHT PANELS:**
1. The image MUST be divided into exactly TWO vertical panels (left and right)
2. EACH panel MUST fill 100% of the image HEIGHT - no gaps at top or bottom
3. The left and right scenes MUST extend from the very TOP edge to the very BOTTOM edge
4. NO horizontal whitespace or padding between the panels and the image boundaries
5. The dividing line between panels should be a clean vertical split at the center

**PANEL COMPOSITION:**
- LEFT PANEL: Shows the first opposite concept, fills entire left half from top to bottom
- RIGHT PANEL: Shows the contrasting opposite concept, fills entire right half from top to bottom
- Both panels share a continuous background that flows edge-to-edge
- Characters and elements are positioned within each panel but the SCENE fills the full height

**NEGATIVE CONSTRAINTS:**
- NEVER leave empty space above or below the scene content
- NEVER create "floating" panels with margins around them
- NEVER add decorative borders that shrink the scene area
- The sky/background MUST extend to the top edge
- The ground/floor MUST extend to the bottom edge

These split-screen rules are MANDATORY and override any conflicting composition instructions.
`;

// --- Enhancement logic mirrored from generate-color-image/index.ts ---

const PRO_MODEL_PAGE_TYPES = ['cover', 'educational'];

function addNegativePrompt(prompt: string): string {
  if (!prompt) return '';
  if (prompt.toLowerCase().includes('do not add any text')) return prompt;
  return prompt.replace(/\.?\s*$/, '. ' + NEGATIVE_PROMPT);
}

function generateCoverTitleInstruction(bookTitle: string): string {
  return `CRITICAL INSTRUCTION: Display the book title "${bookTitle}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.`;
}

export interface PromptEnhancerConfig {
  /** The raw/sanitized prompt */
  prompt: string;
  /** Page type: 'cover', 'educational', or 'content' */
  pageType?: string;
  /** Book title (used for cover page title instruction) */
  bookTitle?: string;
  /** Book category (e.g. 'opposites') */
  bookCategory?: string;
}

/**
 * Applies the same enhancements as the generate-color-image edge function.
 * Call this before copying to clipboard so the copied prompt matches generation.
 */
export function enhancePromptForGeneration(config: PromptEnhancerConfig): string {
  const { prompt, pageType, bookTitle, bookCategory } = config;
  if (!prompt) return '';

  // 1. Aspect ratio prefix for cover/educational pages
  const requiresSquareFormat = pageType && PRO_MODEL_PAGE_TYPES.includes(pageType);
  const aspectRatioPrefix = requiresSquareFormat
    ? `${COVER_ASPECT_RATIO_SQUARE}\n\n`
    : '';

  // 2. Cover title instruction for cover pages
  const isCoverPage = pageType === 'cover';
  const coverTitlePrefix = isCoverPage && bookTitle
    ? `CRITICAL - BOOK COVER: This is a COVER PAGE for the book titled "${bookTitle}". ${generateCoverTitleInstruction(bookTitle)}\n\n`
    : '';

  // 3. Opposites split-screen rules for opposites book content pages
  const isOppositesContentPage = bookCategory === 'opposites' && pageType === 'content';
  const oppositesSuffix = isOppositesContentPage ? OPPOSITES_SPLIT_SCREEN_RULES : '';

  // 4. Negative prompt (always added)
  const promptWithNegative = addNegativePrompt(prompt);

  return aspectRatioPrefix + coverTitlePrefix + promptWithNegative + oppositesSuffix;
}
