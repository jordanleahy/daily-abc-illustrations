/**
 * Specialized prompt templates for different book types and pages
 * Uses layered prompt architecture for strategic information organization
 */

import { 
  getStyleGuide, 
  getCharacterDetails, 
  getSettingDetails, 
  getVisualStyleSummary, 
  getCriticalConstraints 
} from './styleGuides.ts';
import { stripHexCodes, enforceBearStoriesSnowboarding } from './templateProcessor.ts';

/**
 * LAYERED PROMPT ARCHITECTURE
 * Strategically organizes prompt information into 5 layers for maximum AI effectiveness
 */
export function generateLayeredPrompt(
  sceneDescription: string,
  characters: Array<{ name: string; details: string }>,
  setting: string,
  visualStyle: string,
  constraints: string[]
): string {
  let prompt = '';

  // LAYER 1: Scene Description (What's happening)
  prompt += `[SCENE]: ${sceneDescription}\n\n`;

  // LAYER 2: Character Details (Who with specific identifiers)
  if (characters.length > 0) {
    prompt += `[CHARACTER SPECIFICATIONS]:\n`;
    for (const char of characters) {
      prompt += `- ${char.details}\n`;
    }
    prompt += '\n';
  }

  // LAYER 3: Setting & Atmosphere (Where with color/mood)
  if (setting) {
    prompt += `[SETTING & ATMOSPHERE]: ${setting}\n\n`;
  }

  // LAYER 4: Visual Style & Quality (How it should look)
  if (visualStyle) {
    prompt += `[VISUAL STYLE]: ${visualStyle}\n\n`;
  }

  // LAYER 5: Critical Constraints (Final enforcement)
  if (constraints.length > 0) {
    prompt += `[CRITICAL REQUIREMENTS - NON-NEGOTIABLE]:\n`;
    for (const constraint of constraints) {
      prompt += `${constraint}\n`;
    }
  }

  return prompt.trim();
}

/**
 * Extract character names from scene description
 */
function extractCharacterNames(sceneText: string): string[] {
  const names: string[] = [];
  const text = sceneText.toLowerCase();
  
  if (text.includes('mama bear') || text.includes('mama')) names.push('Mama Bear');
  if (text.includes('papa bear') || text.includes('papa')) names.push('Papa Bear');
  if (text.includes('dandan') || text.includes('big sister')) names.push('Big Sister Bear');
  if (text.includes('chelson') || text.includes('little brother')) names.push('Little Brother Bear');
  
  return names;
}

interface BookContext {
  bookName: string;
  category: string;
  bookDescription: string;
  theme?: string;
  characterTheme?: string;
  targetAge?: string;
  bookType?: string;
}

interface PageContext {
  pageNumber: number;
  letter: string;
  title: string;
  description: string;
  mainConcept?: string;
}

/**
 * Generate cover page prompt based on book type and context
 */
export function generateCoverPrompt(book: BookContext, textOverlayEnabled: boolean = true, styleGuide?: string): string {
  const characterInfo = book.characterTheme 
    ? `featuring ${book.characterTheme} characters` 
    : '';
  
  const typeInfo = getBookTypeDescription(book.bookType || book.category);
  
  // Determine learning type and specific skill based on book type
  const learningDetails = getLearningDetails(book.bookType || book.category);
  
  return `You are creating a COMPREHENSIVE COVER IMAGE for "${book.bookName}" that combines both a charming scene AND an educational information card.

BOOK CONTEXT:
- Title: ${book.bookName}
- Category: ${book.category}
- Educational Focus: ${typeInfo}
- Description: ${book.bookDescription}
${book.characterTheme ? `- Character Theme: ${book.characterTheme}` : ''}
${book.targetAge ? `- Target Age: ${book.targetAge}` : ''}

THIS IMAGE MUST CONTAIN TWO DISTINCT SECTIONS:

**SECTION 1: MAIN COVER SCENE (Top/Main portion)**
Create an inviting, colorful scene that captures the essence of "${book.bookName}":
- Feature ${characterInfo || 'engaging characters'} in a playful, educational setting
- Background should be a bright, sunny field with fluffy clouds OR an appropriate thematic background
- Overall mood should be playful and educational
- Use vibrant colors and child-friendly illustration style
- Professional children's book quality with clear, simple shapes

${textOverlayEnabled ? `Include text overlay displaying '${book.bookName.toUpperCase()}' in large, clear, child-friendly letters integrated naturally into the scene.` : ''}

**SECTION 2: EDUCATIONAL FOCUS INFORMATION CARD (Lower portion or side panel)**
Create a vibrant, clean educational information card with three distinct badge sections arranged vertically using ${book.characterTheme ? `${book.characterTheme}'s characteristic color palette` : 'bright, cheerful colors (red, blue, green, yellow, pink pastels)'}:

1. TOP BADGE (Pink/Primary Color):
   - Text: "AGE: ${book.targetAge || '1-3 YEARS'}"
   - Include a simple child icon
   - Rounded, cheerful badge design

2. MIDDLE BADGE (Yellow/Secondary Color):
   - Text: "${learningDetails.learningType}"
   - Include an open book icon or relevant learning icon
   - Same rounded, cheerful style

3. BOTTOM BADGE (Green/Tertiary Color):
   - Text: "${learningDetails.specificSkill}"
   - Include an icon representing the skill (like a block with "abc" for letters)
   - Consistent rounded design

The information card should:
- Use rounded, child-friendly typography consistent with ${book.characterTheme || 'the'} animation style
- Have a pastel blue sky background with a hint of green grass
- Feature NO text overlays beyond the badge text itself
- Be cheerful and inviting with clear visual hierarchy
- Integrate harmoniously with the main scene

OVERALL COMPOSITION:
- Square format (1:1) with balanced layout between scene and info card
- High contrast and clarity for young readers
- Ensure both the character scene and educational badges are clearly visible
- The design should feel unified as one cohesive cover image

${textOverlayEnabled ? `TEXT INCLUSION:
- Main title "${book.bookName}" in the scene portion
- Educational badge text as specified above
- All text should be clear, bold, and easy to read for young children` : `CRITICAL - NO TEXT REQUIREMENT:
- DO NOT include ANY text in the main scene portion
- Educational badges should be shown as colored shapes WITHOUT text
- All text will be added separately as an overlay
- The illustration must be structured to accommodate text overlay`}

Create a captivating, comprehensive cover that combines an engaging scene with clear educational information!`;
}

/**
 * Generate content page prompt based on page details
 */
export function generatePagePrompt(book: BookContext, page: PageContext, textOverlayEnabled: boolean = true, styleGuide?: string): string {
  const isFirstPage = page.pageNumber === 1;
  const characterInfo = book.characterTheme 
    ? `featuring ${book.characterTheme}` 
    : '';
  
  const noTextWarning = !textOverlayEnabled ? `
🚫🚫🚫 ABSOLUTELY NO TEXT IN THIS IMAGE 🚫🚫🚫
========================================
CRITICAL REQUIREMENT: This image must be 100% TEXT-FREE.
- NO letters, words, numbers, or any written characters
- NO text on signs, books, labels, clothing, walls, or anywhere
- NO visible writing of any kind whatsoever
- If you include ANY text, this image will be rejected
- Text overlays will be added separately in post-processing
- Your job is ONLY to create the visual scene without any text
========================================
` : '';
  
  return `${noTextWarning}You are creating PAGE ${page.pageNumber} for "${book.bookName}", a ${book.category} book ${characterInfo}.

PAGE DETAILS:
- Letter/Number: ${page.letter}
- Title: ${page.title}
- Description: ${page.description}
${page.mainConcept ? `- Main Concept: ${page.mainConcept}` : ''}

BOOK CONTEXT:
- Overall Theme: ${book.bookDescription}
${book.characterTheme ? `- Character Theme: ${book.characterTheme}` : ''}

ILLUSTRATION REQUIREMENTS:
1. Create a clear, focused illustration of: ${page.description}
2. Make the concept "${page.title}" immediately recognizable
3. Use vibrant, engaging colors that appeal to young children
${isFirstPage ? '4. Establish the visual style that will continue throughout the book' : '4. Maintain consistency with the book\'s established visual style'}
5. Include educational elements that support learning
6. Keep the composition simple and uncluttered

COMPOSITION:
- Main subject/focus object MUST be positioned at the CENTER of the image
- Single clear focal point representing the main subject at center
- Center-weighted composition with the focal point as the visual anchor
- Background elements should radiate outward from the centered subject
- Ensure equal spacing/breathing room on all sides of the main subject
- Simple, supportive background that doesn't distract from the centered focus
- Square format (1:1) optimized for viewing
- High contrast for visual clarity
${getCenterFocusInstructions()}

VISUAL STYLE:
- Bright, bold colors with clear outlines
- Child-friendly, positive imagery
- Age-appropriate detail level (3-6 years)
- Engaging and fun while educational
- Professional children's book illustration quality

${textOverlayEnabled ? `TEXT INCLUSION:
- Include the page text "${page.title}" prominently in the illustration
- Make the text clear, bold, and easy to read for young children
- Use playful, child-friendly typography appropriate for learning
- Integrate the text naturally into the scene` : `🚫 CRITICAL - ABSOLUTELY NO TEXT ALLOWED 🚫
===============================================
- DO NOT include ANY text, words, letters, or numbers in the illustration
- NO visible text of any kind - not on signs, books, labels, clothing, or anywhere else
- This is a CLEAN ILLUSTRATION ONLY - all text will be added separately as an overlay
- If the concept involves text elements (like books, signs, or labels), show them as blank objects
- The image must be 100% text-free - this is absolutely mandatory
- Focus purely on visual storytelling without any written words
- If there is ANY text in your image, it will be rejected
===============================================`}

Create an illustration that brings "${page.title}" to life in an engaging, educational way!${!textOverlayEnabled ? '\n\n🚫 FINAL REMINDER: NO TEXT OF ANY KIND IN THIS IMAGE 🚫' : ''}`;
}

/**
 * Get descriptive text for book type
 */
function getBookTypeDescription(bookType: string): string {
  const typeMap: Record<string, string> = {
    'abc': 'alphabet learning',
    'alphabet': 'alphabet learning',
    'numbers': 'counting and numbers',
    'shapes': 'shapes and geometry',
    'colors': 'colors and color recognition',
    'animals': 'animals and nature',
    'emotions': 'emotions and feelings',
    'sight-words': 'sight words and reading',
    'story': 'storytelling',
    'educational': 'educational'
  };
  
  return typeMap[bookType.toLowerCase()] || 'educational learning';
}

/**
 * Get learning details for educational focus card
 */
function getLearningDetails(bookType: string): { learningType: string; specificSkill: string } {
  const detailsMap: Record<string, { learningType: string; specificSkill: string }> = {
    'abc': {
      learningType: 'PHONICS | EARLY LITERACY',
      specificSkill: 'FOCUS: LOWERCASE A-Z'
    },
    'alphabet': {
      learningType: 'PHONICS | EARLY LITERACY',
      specificSkill: 'FOCUS: LETTER RECOGNITION'
    },
    'numbers': {
      learningType: 'MATH | COUNTING',
      specificSkill: 'FOCUS: NUMBERS 1-10'
    },
    'shapes': {
      learningType: 'GEOMETRY | VISUAL',
      specificSkill: 'FOCUS: BASIC SHAPES'
    },
    'colors': {
      learningType: 'VISUAL | RECOGNITION',
      specificSkill: 'FOCUS: COLOR LEARNING'
    },
    'animals': {
      learningType: 'NATURE | SCIENCE',
      specificSkill: 'FOCUS: ANIMAL DISCOVERY'
    },
    'emotions': {
      learningType: 'SOCIAL | EMOTIONAL',
      specificSkill: 'FOCUS: FEELINGS'
    },
    'sight-words': {
      learningType: 'READING | LITERACY',
      specificSkill: 'FOCUS: SIGHT WORDS'
    },
    'story': {
      learningType: 'READING | COMPREHENSION',
      specificSkill: 'FOCUS: STORYTELLING'
    }
  };
  
  return detailsMap[bookType.toLowerCase()] || {
    learningType: 'EARLY LEARNING',
    specificSkill: 'FOCUS: EDUCATIONAL'
  };
}

/**
 * Generate template-based prompt for specific book types
 * Now uses layered architecture when styleGuideKey is provided
 */
export function generateSpecializedPrompt(
  book: BookContext, 
  page: PageContext, 
  isCover: boolean, 
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  // Generate base prompt based on book type - NOW passing styleGuideKey
  let prompt = '';
  
  if (isCover) {
    prompt = generateCoverPromptLayered(book, textOverlayEnabled, styleGuideKey);
  } else {
    // Check for specialized book types
    const bookType = (book.bookType || book.category).toLowerCase();
    
    switch (bookType) {
      case 'abc':
      case 'alphabet':
        prompt = generateAlphabetPagePromptLayered(book, page, textOverlayEnabled, styleGuideKey);
        break;
      
      case 'numbers':
        prompt = generateNumbersPagePromptLayered(book, page, textOverlayEnabled, styleGuideKey);
        break;
      
      case 'colors':
        prompt = generateColorsPagePromptLayered(book, page, textOverlayEnabled, styleGuideKey);
        break;
      
      case 'emotions':
        prompt = generateEmotionsPagePromptLayered(book, page, textOverlayEnabled, styleGuideKey);
        break;
      
      default:
        prompt = generatePagePromptLayered(book, page, textOverlayEnabled, styleGuideKey);
    }
  }
  
  // Strip hex codes from final prompt
  let finalPrompt = stripHexCodes(prompt);
  
  // For Bear Stories, enforce snowboarding context
  if (styleGuideKey === 'bear-stories') {
    finalPrompt = enforceBearStoriesSnowboarding(finalPrompt, styleGuideKey);
  }
  
  return finalPrompt;
}

/**
 * Generate cover prompt with layered architecture
 */
function generateCoverPromptLayered(
  book: BookContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  // LAYER 1: Scene Description
  let sceneDescription = `Book cover design for: "${book.bookName}". Category: ${book.category}. Theme: ${book.bookDescription}. Design a vibrant, eye-catching cover that clearly represents the book's theme, uses bold engaging colors, features main characters or key learning elements, and creates excitement and curiosity.`;
  
  if (!textOverlayEnabled) {
    sceneDescription += ' CRITICAL: Generate cover illustration WITHOUT the book title text. No visible text of any kind - pure visual cover design. Title will be added as overlay later.';
  } else {
    sceneDescription += ` Include the title "${book.bookName}" prominently displayed with large, clear, child-friendly lettering.`;
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(book.bookDescription || '');
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to the original cover prompt function
  return generateCoverPrompt(book, textOverlayEnabled);
}

/**
 * Generate page prompt with layered architecture
 */
function generatePagePromptLayered(
  book: BookContext,
  page: PageContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  // LAYER 1: Scene Description
  let sceneDescription = `Illustration for: ${page.title}. ${page.description}. Style: Maintain consistent visual style from book: "${book.bookName}" (${book.category})`;
  
  if (!textOverlayEnabled) {
    sceneDescription += '. CRITICAL: Generate illustration WITHOUT any text overlays. No visible text of any kind - pure visual illustration. Text will be added as overlay later.';
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(page.description);
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to original function
  return generatePagePrompt(book, page, textOverlayEnabled);
}

/**
 * Generate alphabet page prompt with layered architecture
 */
function generateAlphabetPagePromptLayered(
  book: BookContext,
  page: PageContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  const letter = page.letter?.toUpperCase() || 'A';
  const word = page.title?.replace(/^\([a-zA-Z]\)\s*is for\s*/i, '') || 'word';
  
  // LAYER 1: Scene Description
  let sceneDescription = `Educational illustration for letter ${letter}: ${word}. ${page.description}. Focus on the word "${word}" with clear visual representation.`;
  
  if (!textOverlayEnabled) {
    sceneDescription += ' CRITICAL: Generate illustration WITHOUT any text, letters, or words. No visible text of any kind - pure visual storytelling only. Text will be added as overlay later.';
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(page.description);
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to original function
  return generateAlphabetPagePrompt(book, page, textOverlayEnabled);
}

/**
 * Generate numbers page prompt with layered architecture
 */
function generateNumbersPagePromptLayered(
  book: BookContext,
  page: PageContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  const numberMatch = page.title?.match(/\d+/) || page.description?.match(/\d+/);
  const number = numberMatch ? numberMatch[0] : '1';
  
  // LAYER 1: Scene Description
  let sceneDescription = `Educational illustration for number ${number}. ${page.description}. CRITICAL: Show exactly ${number} items/objects clearly visible and countable. Arrange items in a pattern that makes counting easy and obvious.`;
  
  if (!textOverlayEnabled) {
    sceneDescription += ' CRITICAL: Generate illustration WITHOUT any text, numbers, or numerals. No visible text of any kind - pure visual counting exercise. Text will be added as overlay later.';
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(page.description);
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to original function
  return generateNumbersPagePrompt(book, page, textOverlayEnabled);
}

/**
 * Generate colors page prompt with layered architecture
 */
function generateColorsPagePromptLayered(
  book: BookContext,
  page: PageContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  const color = page.content?.color || 'color';
  
  // LAYER 1: Scene Description
  let sceneDescription = `Educational illustration focused on the color ${color}. ${page.description}. CRITICAL: The color ${color} should be the DOMINANT color throughout. Use various shades and tones of ${color} to create visual interest.`;
  
  if (!textOverlayEnabled) {
    sceneDescription += ' CRITICAL: Generate illustration WITHOUT any text or color names visible. No visible text of any kind - pure visual color demonstration. Text will be added as overlay later.';
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(page.description);
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to original function
  return generateColorsPagePrompt(book, page, textOverlayEnabled);
}

/**
 * Generate emotions page prompt with layered architecture
 */
function generateEmotionsPagePromptLayered(
  book: BookContext,
  page: PageContext,
  textOverlayEnabled: boolean = true,
  styleGuideKey?: string
): string {
  const emotion = page.title?.toLowerCase() || 'emotion';
  
  // LAYER 1: Scene Description
  let sceneDescription = `Educational illustration demonstrating the emotion: ${emotion}. ${page.description}. CRITICAL: Focus on clear facial expressions and body language. The character(s) should clearly convey ${emotion} through facial expression, body posture, and environmental cues.`;
  
  if (!textOverlayEnabled) {
    sceneDescription += ' CRITICAL: Generate illustration WITHOUT any text or emotion labels. No visible text of any kind - pure visual emotional expression. Text will be added as overlay later.';
  }
  
  // Use layered architecture if style guide provided
  if (styleGuideKey) {
    const characterNames = extractCharacterNames(page.description);
    const characters = getCharacterDetails(styleGuideKey, characterNames);
    const setting = getSettingDetails(styleGuideKey);
    const visualStyle = getVisualStyleSummary(styleGuideKey);
    const constraints = getCriticalConstraints(styleGuideKey);
    
    return generateLayeredPrompt(sceneDescription, characters, setting, visualStyle, constraints);
  }
  
  // Fallback to original function
  return generateEmotionsPagePrompt(book, page, textOverlayEnabled);
}

/**
 * Specialized prompt for alphabet books
 */
function generateAlphabetPagePrompt(book: BookContext, page: PageContext, textOverlayEnabled: boolean = true): string {
  const noTextWarning = !textOverlayEnabled ? `
🚫🚫🚫 ABSOLUTELY NO TEXT IN THIS IMAGE 🚫🚫🚫
========================================
CRITICAL REQUIREMENT: This image must be 100% TEXT-FREE.
- NO letters, words, alphabet, numbers, or any written characters
- NO text on signs, books, labels, clothing, walls, or anywhere
- NO visible writing of any kind whatsoever
- If you include ANY text, this image will be rejected
- Text overlays will be added separately in post-processing
- Your job is ONLY to create the visual scene without any text
========================================
` : '';

  return `${noTextWarning}You are creating an ALPHABET PAGE for "${book.bookName}".

LETTER PAGE DETAILS:
- Letter: ${page.letter}
- Word/Concept: ${page.title}
- Scene: ${page.description}

ALPHABET PAGE REQUIREMENTS:
1. Feature the letter "${page.letter}" concept prominently: ${page.description}
2. Make the word "${page.title}" visually clear and memorable
3. Create a scene that helps children associate "${page.letter}" with "${page.title}"
4. Use bright, engaging colors that capture attention
5. Include visual elements that reinforce the letter sound and word

COMPOSITION:
- Main subject "${page.title}" MUST be positioned at the CENTER as the focal point
- Center-weighted layout with equal spacing on all sides
- Supporting elements that enhance the learning connection, arranged around center
- Square format (1:1) with clear, uncluttered design
${getCenterFocusInstructions()}

${textOverlayEnabled ? `TEXT INCLUSION:
- Display the letter "${page.letter}" prominently in large, bold text
- Include the word "${page.title}" clearly in the illustration
- Use playful, educational typography suitable for early learners` : `🚫 CRITICAL - ABSOLUTELY NO TEXT ALLOWED 🚫
===============================================
- DO NOT include the letter "${page.letter}" as text anywhere in the image
- DO NOT show any words, letters, numbers, or alphabet characters
- DO NOT add labels, captions, or any written text
- Focus purely on the visual concept - show only the object/scene
- All text (letter and word) will be added separately as an overlay
- The illustration must be completely text-free
- If there is ANY text in your image, it will be rejected
===============================================`}

Create an engaging illustration that makes learning the letter "${page.letter}" fun and memorable!${!textOverlayEnabled ? '\n\n🚫 FINAL REMINDER: NO TEXT OF ANY KIND IN THIS IMAGE 🚫' : ''}`;
}

/**
 * Specialized prompt for numbers books
 */
function generateNumbersPagePrompt(book: BookContext, page: PageContext, textOverlayEnabled: boolean = true): string {
  const noTextWarning = !textOverlayEnabled ? `
🚫🚫🚫 ABSOLUTELY NO TEXT IN THIS IMAGE 🚫🚫🚫
========================================
CRITICAL REQUIREMENT: This image must be 100% TEXT-FREE.
- NO letters, words, numbers, or any written characters
- NO text on signs, books, labels, clothing, walls, or anywhere
- NO visible writing of any kind whatsoever
- If you include ANY text, this image will be rejected
========================================
` : '';

  return `${noTextWarning}You are creating a NUMBERS PAGE for "${book.bookName}".

NUMBER PAGE DETAILS:
- Number: ${page.letter}
- Counting Concept: ${page.title}
- Scene: ${page.description}

COUNTING PAGE REQUIREMENTS:
1. Show exactly ${page.letter} items that children can count
2. Make the items clear, distinct, and easy to count
3. Arrange the items in an engaging, visually interesting pattern
4. Use the concept from: ${page.description}
5. Create a scene that makes counting fun and interactive

COMPOSITION:
- ${page.letter} clearly identifiable items arranged at CENTER
- Center the countable items with balanced arrangement radiating outward
- Arrangement that guides counting from center (balanced pattern)
- Square format (1:1) with organized, countable layout
${getCenterFocusInstructions()}

${textOverlayEnabled ? `TEXT INCLUSION:
- Display the number "${page.letter}" prominently in large, bold text
- Include the word "${page.title}" clearly in the illustration
- Use playful numerals that children can easily recognize` : `🚫 CRITICAL - ABSOLUTELY NO TEXT ALLOWED 🚫
===============================================
- DO NOT include the number "${page.letter}" as text anywhere
- DO NOT show any numerals, words, numbers, or counting labels
- Show only the countable objects visually
- All numbers and text will be added separately as an overlay
- The illustration must be 100% text-free
- If there is ANY text in your image, it will be rejected
===============================================`}

Create an illustration that makes learning to count ${page.letter} fun and clear!${!textOverlayEnabled ? '\n\n🚫 FINAL REMINDER: NO TEXT OF ANY KIND IN THIS IMAGE 🚫' : ''}`;
}

/**
 * Specialized prompt for colors books
 */
function generateColorsPagePrompt(book: BookContext, page: PageContext, textOverlayEnabled: boolean = true): string {
  // Extract color from title (typically format: "**Red:** Description")
  const colorMatch = page.title.match(/\*\*([A-Za-z]+):\*\*/);
  const color = colorMatch ? colorMatch[1] : page.letter;
  
  const noTextWarning = !textOverlayEnabled ? `
🚫🚫🚫 ABSOLUTELY NO TEXT IN THIS IMAGE 🚫🚫🚫
========================================
CRITICAL REQUIREMENT: This image must be 100% TEXT-FREE.
- NO letters, words, color names, or any written characters
- NO text on signs, books, labels, clothing, walls, or anywhere
- NO visible writing of any kind whatsoever
- If you include ANY text, this image will be rejected
========================================
` : '';
  
  return `${noTextWarning}You are creating a COLOR PAGE for "${book.bookName}".

COLOR PAGE DETAILS:
- Featured Color: ${color}
- Scene: ${page.description}
- Title: ${page.title}

COLOR LEARNING REQUIREMENTS:
1. Make ${color.toUpperCase()} the DOMINANT color throughout the entire image
2. Feature items that are naturally ${color} color: ${page.description}
3. Use various shades and tints of ${color} to create depth
4. Ensure the color ${color} is immediately obvious to young learners
5. Create a vibrant, engaging scene that celebrates the color ${color}

COMPOSITION:
- Main subject(s) in prominent ${color} color positioned at CENTER
- Center-focused layout with ${color} items as visual anchor
- Background and supporting elements primarily in ${color}, radiating from center
- High saturation to make the color memorable
- Square format (1:1) with bold, clear ${color} presence
${getCenterFocusInstructions()}

${textOverlayEnabled ? `TEXT INCLUSION:
- Display the color name "${color}" prominently in the illustration
- Use the actual color for the text to reinforce learning
- Make the text bold, clear, and playful` : `🚫 CRITICAL - ABSOLUTELY NO TEXT ALLOWED 🚫
===============================================
- DO NOT include the color name or any text in the illustration
- DO NOT show any words, labels, or written characters
- Focus purely on showing vibrant examples of the color
- All color names and text will be added separately as an overlay
- The illustration must be text-free
- If there is ANY text in your image, it will be rejected
===============================================`}

Create a stunning ${color}-focused illustration that helps children learn and love the color ${color}!`;
}

/**
 * Specialized prompt for emotions books
 */
function generateEmotionsPagePrompt(book: BookContext, page: PageContext, textOverlayEnabled: boolean = true): string {
  const noTextWarning = !textOverlayEnabled ? `
🚫🚫🚫 ABSOLUTELY NO TEXT IN THIS IMAGE 🚫🚫🚫
========================================
CRITICAL REQUIREMENT: This image must be 100% TEXT-FREE.
- NO letters, words, emotion names, or any written characters
- NO text on signs, books, labels, clothing, walls, or anywhere
- NO visible writing of any kind whatsoever
- If you include ANY text, this image will be rejected
========================================
` : '';
  
  return `${noTextWarning}You are creating an EMOTIONS PAGE for "${book.bookName}".

EMOTION PAGE DETAILS:
- Emotion: ${page.letter}
- Scenario: ${page.title}
- Scene: ${page.description}

EMOTION LEARNING REQUIREMENTS:
1. Show character(s) clearly expressing the emotion: ${page.letter}
2. Feature a relatable situation: ${page.description}
3. Use facial expressions and body language that children can recognize
4. Make the emotion obvious and age-appropriate
5. Create a supportive, understanding atmosphere

COMPOSITION:
- Character's face showing clear emotion MUST be positioned at CENTER as focal point
- Center the emotional expression with equal spacing on all sides
- Scene elements that contextualize the emotion, arranged around centered character
- Warm, empathetic visual tone
- Square format (1:1) with emphasis on centered emotional expression
${getCenterFocusInstructions()}

${textOverlayEnabled ? `TEXT INCLUSION:
- Display the emotion word "${page.letter}" prominently
- Use text styling that reflects the emotion (bold for anger, flowing for calm, etc.)
- Make it clear and readable for young learners` : `🚫 CRITICAL - ABSOLUTELY NO TEXT ALLOWED 🚫
===============================================
- DO NOT include the emotion name or any text in the illustration
- DO NOT show any words, labels, or written characters
- Focus purely on visual emotional expression through faces and body language
- All emotion names and text will be added separately as an overlay
- The illustration must be text-free
- If there is ANY text in your image, it will be rejected
===============================================`}

Create an illustration that helps children recognize and understand the emotion of ${page.letter}!${!textOverlayEnabled ? '\n\n🚫 FINAL REMINDER: NO TEXT OF ANY KIND IN THIS IMAGE 🚫' : ''}`;
}
