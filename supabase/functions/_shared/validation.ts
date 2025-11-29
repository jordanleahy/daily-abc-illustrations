import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============= Response Format Validation =============

/**
 * Validates ABC book outline structure from AI response
 * Ensures all 28 pages are present with correct format
 */
export const ABCOutlineSchema = z.object({
  bookName: z.string().min(1, 'Book name required'),
  bookDescription: z.string().optional(),
  pages: z.array(
    z.object({
      pageNumber: z.number().int().min(1).max(28),
      pageType: z.enum(['cover', 'educational', 'content']),
      letter: z.string().regex(/^[A-Za-z]$|^Cover$|^Educational Focus$/, 'Invalid letter format'),
      title: z.string().min(1, 'Page title required'),
      description: z.string().min(50, 'Image prompt must be at least 50 characters'),
    })
  ).length(28, 'ABC book must have exactly 28 pages')
});

/**
 * Validates page title format for ABC books
 */
export function validateABCPageTitle(title: string, letterCase: string): {
  valid: boolean;
  error?: string;
} {
  // Cover and Educational Focus pages don't need validation
  if (title.toLowerCase().includes('cover') || title.toLowerCase().includes('educational')) {
    return { valid: true };
  }

  // Check parentheses format: "(letter) is for word"
  const parenthesesPattern = /^\([A-Za-z]\)\s+is\s+for\s+\w+/i;
  if (!parenthesesPattern.test(title)) {
    return {
      valid: false,
      error: `Title must follow format "(letter) is for word", got: ${title}`
    };
  }

  // Validate letter case matches selection
  const letterMatch = title.match(/^\(([A-Za-z])\)/);
  if (!letterMatch) {
    return { valid: false, error: 'Could not extract letter from title' };
  }

  const letter = letterMatch[1];
  if (letterCase === 'lowercase' && letter !== letter.toLowerCase()) {
    return { valid: false, error: `Lowercase selected but found uppercase: ${letter}` };
  }
  if (letterCase === 'uppercase' && letter !== letter.toUpperCase()) {
    return { valid: false, error: `Uppercase selected but found lowercase: ${letter}` };
  }

  return { valid: true };
}

/**
 * Validates image prompt meets requirements
 */
export function validateImagePrompt(prompt: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = prompt.trim();
  
  // Length check: 200-350 characters recommended
  if (trimmed.length < 50) {
    return { valid: false, error: `Prompt too short (${trimmed.length} chars, min 50)` };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: `Prompt too long (${trimmed.length} chars, max 500)` };
  }

  // Must end with mandatory phrase
  const mandatoryEnding = 'No text overlays. Clean illustration only.';
  if (!trimmed.endsWith(mandatoryEnding)) {
    return {
      valid: false,
      error: `Prompt must end with: "${mandatoryEnding}"`
    };
  }

  return { valid: true };
}

/**
 * Validates complete ABC book structure
 */
export function validateABCBookStructure(
  pages: any[],
  letterCase: string
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check page count
  if (pages.length !== 28) {
    errors.push(`Expected 28 pages, got ${pages.length}`);
  }

  // Check for cover page (page 1)
  const coverPage = pages.find(p => p.pageNumber === 1);
  if (!coverPage || coverPage.pageType !== 'cover') {
    errors.push('Missing or invalid cover page (page 1)');
  }

  // Check for educational focus page (page 2)
  const eduPage = pages.find(p => p.pageNumber === 2);
  if (!eduPage || eduPage.pageType !== 'educational') {
    errors.push('Missing or invalid educational focus page (page 2)');
  }

  // Check all 26 letter pages (pages 3-28)
  const expectedLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const contentPages = pages.filter(p => p.pageType === 'content');
  
  if (contentPages.length !== 26) {
    errors.push(`Expected 26 content pages, got ${contentPages.length}`);
  }

  // Validate each letter page
  contentPages.forEach((page, index) => {
    const expectedLetter = expectedLetters[index];
    
    // Title format validation
    const titleValidation = validateABCPageTitle(page.title, letterCase);
    if (!titleValidation.valid) {
      errors.push(`Page ${page.pageNumber}: ${titleValidation.error}`);
    }

    // Image prompt validation
    const promptValidation = validateImagePrompt(page.description);
    if (!promptValidation.valid) {
      errors.push(`Page ${page.pageNumber}: ${promptValidation.error}`);
    }

    // Letter sequence validation
    const letterMatch = page.title.match(/^\(([A-Za-z])\)/);
    if (letterMatch) {
      const actualLetter = letterMatch[1].toUpperCase();
      if (actualLetter !== expectedLetter) {
        errors.push(
          `Page ${page.pageNumber}: Expected letter ${expectedLetter}, got ${actualLetter}`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============= Sanitization Utilities =============

/**
 * Aggressive text sanitization for user input
 */
export function sanitizeUserInput(text: string, maxLength = 1000): string {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, maxLength)
    .trim();
}

/**
 * Sanitize AI response to prevent injection
 */
export function sanitizeAIResponse(text: string): string {
  // Keep markdown but remove dangerous patterns
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// ============= Error Recovery Utilities =============

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Parse with fallback handling
 */
export function safeJSONParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}
