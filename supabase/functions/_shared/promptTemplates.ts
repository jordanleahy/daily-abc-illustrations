/**
 * Specialized prompt templates for different book types and pages
 * Used to generate rich, context-aware image generation prompts
 */

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
export function generateCoverPrompt(book: BookContext): string {
  const characterInfo = book.characterTheme 
    ? `featuring ${book.characterTheme} characters` 
    : '';
  
  const typeInfo = getBookTypeDescription(book.bookType || book.category);
  
  return `You are creating the COVER IMAGE for "${book.bookName}", a ${typeInfo} book for young children ${characterInfo}.

BOOK CONTEXT:
- Title: ${book.bookName}
- Category: ${book.category}
- Educational Focus: ${typeInfo}
- Description: ${book.bookDescription}
${book.characterTheme ? `- Character Theme: ${book.characterTheme}` : ''}
${book.targetAge ? `- Target Age: ${book.targetAge}` : ''}

COVER DESIGN REQUIREMENTS:
1. Create an inviting, colorful scene that captures the essence of "${book.bookName}"
2. Feature main visual elements or characters that will appear throughout the book
3. Make it engaging and exciting to make children want to explore the book
4. Include visual cues that indicate this is a ${typeInfo} learning book
5. Use bright, cheerful colors appropriate for early learners (ages 3-6)
6. Create depth and visual interest while maintaining simplicity

COMPOSITION GUIDELINES:
- Central focal point with the main character or key visual element
- Supporting background that establishes the book's world/theme
- Leave clear space in the CENTER for the title text "${book.bookName}"
- Square format (1:1) with proper margins for text overlay
- Ensure high contrast and clarity for young readers

VISUAL STYLE:
- Bright, vibrant colors with bold outlines
- Child-friendly, approachable illustration style
- Clear, simple shapes that are easy to recognize
- Positive, encouraging atmosphere
- Professional children's book quality

Create a captivating cover that immediately communicates this is an exciting ${typeInfo} learning adventure!`;
}

/**
 * Generate content page prompt based on page details
 */
export function generatePagePrompt(book: BookContext, page: PageContext): string {
  const isFirstPage = page.pageNumber === 1;
  const characterInfo = book.characterTheme 
    ? `featuring ${book.characterTheme}` 
    : '';
  
  return `You are creating PAGE ${page.pageNumber} for "${book.bookName}", a ${book.category} book ${characterInfo}.

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
- Single clear focal point representing the main subject
- Simple, supportive background that doesn't distract
- Square format (1:1) optimized for viewing
- High contrast for visual clarity
- No text in the image (text will be overlaid separately)

VISUAL STYLE:
- Bright, bold colors with clear outlines
- Child-friendly, positive imagery
- Age-appropriate detail level (3-6 years)
- Engaging and fun while educational
- Professional children's book illustration quality

Create an illustration that brings "${page.title}" to life in an engaging, educational way!`;
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
 * Generate template-based prompt for specific book types
 */
export function generateSpecializedPrompt(
  book: BookContext, 
  page: PageContext, 
  isCover: boolean
): string {
  if (isCover) {
    return generateCoverPrompt(book);
  }
  
  // Check for specialized book types
  const bookType = (book.bookType || book.category).toLowerCase();
  
  switch (bookType) {
    case 'abc':
    case 'alphabet':
      return generateAlphabetPagePrompt(book, page);
    
    case 'numbers':
      return generateNumbersPagePrompt(book, page);
    
    case 'colors':
      return generateColorsPagePrompt(book, page);
    
    case 'emotions':
      return generateEmotionsPagePrompt(book, page);
    
    default:
      return generatePagePrompt(book, page);
  }
}

/**
 * Specialized prompt for alphabet books
 */
function generateAlphabetPagePrompt(book: BookContext, page: PageContext): string {
  return `You are creating an ALPHABET PAGE for "${book.bookName}".

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
- Main subject representing "${page.title}" as the focal point
- Supporting elements that enhance the learning connection
- Leave space for the letter "${page.letter}" to be overlaid
- Square format (1:1) with clear, uncluttered design

Create an engaging illustration that makes learning the letter "${page.letter}" fun and memorable!`;
}

/**
 * Specialized prompt for numbers books
 */
function generateNumbersPagePrompt(book: BookContext, page: PageContext): string {
  return `You are creating a NUMBERS PAGE for "${book.bookName}".

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
- ${page.letter} clearly identifiable items as main subjects
- Arrangement that guides counting (left to right, top to bottom)
- Leave space for the number "${page.letter}" to be overlaid
- Square format (1:1) with organized, countable layout

Create an illustration that makes learning to count ${page.letter} fun and clear!`;
}

/**
 * Specialized prompt for colors books
 */
function generateColorsPagePrompt(book: BookContext, page: PageContext): string {
  // Extract color from title (typically format: "**Red:** Description")
  const colorMatch = page.title.match(/\*\*([A-Za-z]+):\*\*/);
  const color = colorMatch ? colorMatch[1] : page.letter;
  
  return `You are creating a COLOR PAGE for "${book.bookName}".

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
- Main subject(s) in prominent ${color} color
- Background and supporting elements primarily in ${color}
- High saturation to make the color memorable
- Square format (1:1) with bold, clear ${color} presence

Create a stunning ${color}-focused illustration that helps children learn and love the color ${color}!`;
}

/**
 * Specialized prompt for emotions books
 */
function generateEmotionsPagePrompt(book: BookContext, page: PageContext): string {
  return `You are creating an EMOTIONS PAGE for "${book.bookName}".

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
- Character's face showing clear emotion as focal point
- Scene that contextualizes why they feel ${page.letter}
- Warm, empathetic visual tone
- Square format (1:1) with emphasis on emotional expression

Create an illustration that helps children recognize and understand the emotion of ${page.letter}!`;
}
