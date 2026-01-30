/**
 * Centralized Cover Page Prompt Constants
 * 
 * Single source of truth for cover page image generation prompts.
 * All cover-related prompt logic should import from this file.
 * 
 * Approach C: Layered Composition with Modular Section Builders
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

/**
 * Book type display names for cover titles (H1)
 * Maps book type ID to the main header text
 */
export const BOOK_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'abc': 'ABC Book',
  'alphabet': 'ABC Book',
  'rhyming': 'Rhyme Time',
  'numbers': 'Numbers Book',
  'counting': 'Counting Book',
  'colors': 'Colors Book',
  'shapes': 'Shapes Book',
  'manners': 'Manners Book',
  'emotions': 'Feelings Book',
  'animals': 'Animals Book',
  'bedtime': 'Bedtime Book',
  'sight-words': 'Sight Words',
  'cvc': 'CVC Words',
  'digraphs': 'Digraphs Book',
  'opposites': 'Opposites Book',
};

// ============================================================================
// EXTENDED CONFIGURATION INTERFACES
// ============================================================================

export interface CoverPromptConfig {
  bookTitle: string;
  characterTheme?: string;
  bookDescription?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  includeTitle?: boolean;  // false for text-overlay-later approach
}

/**
 * Extended cover configuration with full attribute context
 */
export interface AttributeDrivenCoverConfig {
  // Core identity
  bookType: string;                    // 'abc', 'rhyming', etc.
  
  // Title attributes (H1 composition)
  gradeLevel?: string;                 // 'PRE_K', 'K', 'GRADE_1', etc.
  season?: string;                     // 'winter', 'spring', 'summer', 'fall'
  
  // Location context (background priority)
  resort?: string;                     // Resort name (highest priority)
  city?: string;                       // City name (second priority)
  
  // Character constraints
  characterTheme?: string;             // Theme ID (e.g., 'bluey', 'paw-patrol')
  selectedCharacterIds?: string[];     // Specific character IDs selected
  characterConstraintText?: string;    // Pre-built constraint text from buildCharacterConstraints
  
  // Visual options
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  includeTitle?: boolean;
  
  // Book metadata
  bookDescription?: string;
}

// ============================================================================
// MODULAR SECTION BUILDERS (Approach C)
// ============================================================================

/**
 * SECTION 1: Build the cover title (H1) based on book type and characteristics
 * 
 * Title format: "[Grade] [Season] [Book Type]"
 * Examples: "Pre-K Winter ABC Book", "Kindergarten Rhyme Time", "1st Grade Colors Book"
 * 
 * IMPORTANT: Character names (Bluey, Bingo, etc.) are NOT included in the title
 */
export function buildCoverTitle(config: AttributeDrivenCoverConfig): string {
  const parts: string[] = [];
  
  // Grade level prefix (optional)
  if (config.gradeLevel) {
    const gradeLabels: Record<string, string> = {
      'PRE_K': 'Pre-K',
      'K': 'Kindergarten',
      'GRADE_1': '1st Grade',
      'GRADE_2': '2nd Grade',
    };
    const gradeLabel = gradeLabels[config.gradeLevel] || config.gradeLevel;
    parts.push(gradeLabel);
  }
  
  // Season modifier (optional)
  if (config.season) {
    const seasonLabels: Record<string, string> = {
      'winter': 'Winter',
      'spring': 'Spring',
      'summer': 'Summer',
      'fall': 'Fall',
      'autumn': 'Fall',
    };
    const seasonLabel = seasonLabels[config.season.toLowerCase()] || config.season;
    parts.push(seasonLabel);
  }
  
  // Book type (required - the H1)
  const bookTypeDisplay = BOOK_TYPE_DISPLAY_NAMES[config.bookType?.toLowerCase()] || 'Adventure Book';
  parts.push(bookTypeDisplay);
  
  return parts.join(' ');
}

/**
 * SECTION 2: Build the background scene description
 * 
 * Priority: Resort > City, with seasonal atmosphere overlay
 * The background sets the visual context without appearing in the title
 */
export function buildCoverBackground(config: AttributeDrivenCoverConfig): string {
  const parts: string[] = [];
  
  // Seasonal atmosphere prefix
  if (config.season) {
    const seasonAtmosphere: Record<string, string> = {
      'winter': 'Snowy winter scene with soft snowfall, frosted trees, and cozy cold-weather atmosphere',
      'spring': 'Bright spring scene with blooming flowers, green grass, and cheerful sunshine',
      'summer': 'Sunny summer scene with bright blue skies, warm lighting, and vibrant colors',
      'fall': 'Autumn scene with colorful falling leaves, warm orange and red tones, and cozy harvest atmosphere',
      'autumn': 'Autumn scene with colorful falling leaves, warm orange and red tones, and cozy harvest atmosphere',
    };
    const atmosphere = seasonAtmosphere[config.season.toLowerCase()];
    if (atmosphere) {
      parts.push(atmosphere);
    }
  }
  
  // Location priority: Resort > City
  if (config.resort) {
    parts.push(`Set at ${config.resort} ski resort with mountain backdrop, ski slopes, and resort lodge elements visible in background`);
  } else if (config.city) {
    parts.push(`Set in ${config.city} with recognizable city landmarks and urban scenery as background elements`);
  }
  
  // Default background if no location
  if (parts.length === 0) {
    parts.push('Bright, cheerful background with soft gradients and playful educational atmosphere');
  }
  
  return parts.join('. ');
}

/**
 * SECTION 3: Build character layer with exact count enforcement
 * 
 * Uses pre-built constraint text from buildCharacterConstraints()
 * Enforces singleton rule: each character appears exactly once
 */
export function buildCharacterLayer(config: AttributeDrivenCoverConfig): string {
  // If pre-built constraint text is provided, use it directly
  if (config.characterConstraintText) {
    return config.characterConstraintText;
  }
  
  // If no characters selected, return empty
  if (!config.selectedCharacterIds?.length) {
    return '';
  }
  
  // Fallback: basic character count enforcement
  const count = config.selectedCharacterIds.length;
  return `
⚠️ CHARACTER COUNT - STRICTLY ENFORCED:
Show EXACTLY ${count} character${count > 1 ? 's' : ''} in this cover image.
Each character appears as a SINGLE individual - no duplicates.
Do NOT include ANY characters beyond the specified ${count}.
`;
}

/**
 * SECTION 4: Build the title display instruction
 * 
 * Generates the instruction for how the title should appear on the cover
 */
export function buildTitleInstruction(config: AttributeDrivenCoverConfig): string {
  if (config.includeTitle === false) {
    return 'CRITICAL: Generate cover WITHOUT any title text. Title will be added as overlay later.';
  }
  
  const title = buildCoverTitle(config);
  
  return `CRITICAL INSTRUCTION: Display the book title "${title}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.`;
}

/**
 * SECTION 5: Build visual style instruction based on character theme
 */
export function buildVisualStyle(config: AttributeDrivenCoverConfig): string {
  const themeStyles: Record<string, string> = {
    'paw-patrol': 'Paw Patrol animation style, bright and playful, clean CGI lighting, bold colors',
    'frozen': 'Disney Frozen style, magical icy lighting with soft sparkles, elegant and whimsical',
    'peppa-pig': 'Peppa Pig style, flat simple shapes, soft pastel colors, minimal shading',
    'bluey': 'Bluey animation style, flat color with soft shadows, warm Australian tones',
    'cocomelon': 'CoComelon 3D CGI style, bright saturated colors, soft rounded shapes',
    'moana': 'Disney Moana style, tropical warm lighting, oceanic tones, vibrant Pacific colors',
    'mickey-mouse': 'Classic Mickey Mouse style, bold outlines, primary colors, retro Disney charm',
    'mario': 'Nintendo Mario style, bright primary colors, playful cartoon aesthetic',
    'sesame-street': 'Sesame Street Muppet style, friendly textures, warm inviting colors',
    'benji-davies': 'Benji Davies watercolor illustration style, gentle muted tones, soft edges',
    'bear-stories': 'Bear Stories cozy illustration style, warm storybook aesthetic, soft textures',
    'no-theme': 'Classic children\'s book illustration, bright colors, clean educational style',
  };
  
  const style = config.characterTheme && themeStyles[config.characterTheme.toLowerCase()]
    ? themeStyles[config.characterTheme.toLowerCase()]
    : 'Classic children\'s book illustration, bright engaging colors, professional quality';
  
  return `VISUAL STYLE: ${style}. Child-friendly, age-appropriate imagery with clear visual hierarchy.`;
}

// ============================================================================
// COMPOSED PROMPT BUILDERS
// ============================================================================

/**
 * Builds a complete attribute-driven cover prompt using layered composition
 * 
 * Composes all sections in the correct order:
 * 1. Aspect ratio
 * 2. Title instruction (H1 = Book Type + Grade + Season)
 * 3. Background scene (Resort/City + Season atmosphere)
 * 4. Character layer (exact count enforcement)
 * 5. Visual style
 */
export function buildAttributeDrivenCoverPrompt(config: AttributeDrivenCoverConfig): string {
  const sections: string[] = [];
  
  // Section 1: Aspect ratio
  const aspectRatio = config.aspectRatio || 'square';
  sections.push(COVER_ASPECT_RATIOS[aspectRatio]);
  
  // Section 2: Title instruction
  sections.push('');
  sections.push(buildTitleInstruction(config));
  
  // Section 3: Background scene
  sections.push('');
  sections.push('[BACKGROUND SCENE]:');
  sections.push(buildCoverBackground(config));
  
  // Section 4: Character layer (if applicable)
  const characterLayer = buildCharacterLayer(config);
  if (characterLayer) {
    sections.push('');
    sections.push(characterLayer);
  }
  
  // Section 5: Visual style
  sections.push('');
  sections.push(buildVisualStyle(config));
  
  // Section 6: Composition guidelines
  sections.push('');
  sections.push(`[COMPOSITION]:
- The title "${buildCoverTitle(config)}" should be the dominant visual element
- Background elements support but don't compete with the title
- Characters (if present) positioned to complement the title layout
- Overall design should be ${COVER_STYLE_DEFAULTS.mood}`);
  
  return sections.join('\n').trim();
}

// ============================================================================
// LEGACY HELPER FUNCTIONS (Backward Compatibility)
// ============================================================================

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
 * @deprecated Use buildAttributeDrivenCoverPrompt for new implementations
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
