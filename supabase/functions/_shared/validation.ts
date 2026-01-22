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

// ============= Unified Book Structure Validation =============

/**
 * Book structure requirements by type
 */
export const BOOK_STRUCTURE_REQUIREMENTS = {
  abc: {
    totalPages: 28,
    coverPages: 1,
    educationalPages: 1,
    contentPages: 26,
    description: 'ABC books require 28 pages: 1 cover + 1 educational + 26 content (A-Z)'
  },
  default: {
    totalPages: 12,
    coverPages: 1,
    educationalPages: 1,
    contentPages: 10,
    description: 'Standard books require 12 pages: 1 cover + 1 educational + 10 content'
  }
} as const;

/**
 * Get structure requirements for a book type
 */
export function getBookStructureRequirements(bookType: string) {
  return bookType === 'abc' 
    ? BOOK_STRUCTURE_REQUIREMENTS.abc 
    : BOOK_STRUCTURE_REQUIREMENTS.default;
}

/**
 * Unified book structure validation
 * Enforces 28 pages for ABC, 12 pages for all other types
 */
export function validateBookStructure(
  pages: any[],
  bookType: string,
  letterCase?: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requirements = getBookStructureRequirements(bookType);

  // === Page Count Validation ===
  if (pages.length !== requirements.totalPages) {
    errors.push(
      `${bookType.toUpperCase()} book requires exactly ${requirements.totalPages} pages, got ${pages.length}. ` +
      `(${requirements.description})`
    );
  }

  // === Cover Page Validation (Page 1) ===
  const coverPage = pages.find(p => p.pageNumber === 1 || p.pageNumber === 0);
  if (!coverPage) {
    errors.push('Missing cover page (page 1)');
  } else if (coverPage.pageType !== 'cover') {
    errors.push(`Page 1 must be pageType "cover", got "${coverPage.pageType}"`);
  }

  // === Educational Focus Page Validation (Page 2) ===
  const eduPage = pages.find(p => p.pageNumber === 2 || p.pageNumber === 1);
  if (!eduPage) {
    errors.push('Missing educational focus page (page 2)');
  } else if (eduPage.pageType !== 'educational') {
    errors.push(`Page 2 must be pageType "educational", got "${eduPage.pageType}"`);
  }

  // === Content Pages Validation ===
  const contentPages = pages.filter(p => p.pageType === 'content');
  
  if (contentPages.length !== requirements.contentPages) {
    errors.push(
      `Expected ${requirements.contentPages} content pages, got ${contentPages.length}`
    );
  }

  // === ABC-Specific Validation ===
  if (bookType === 'abc') {
    const abcValidation = validateABCContentPages(contentPages, letterCase || 'lowercase');
    errors.push(...abcValidation.errors);
    warnings.push(...abcValidation.warnings);
  }

  // === Standard Book Validation ===
  if (bookType !== 'abc') {
    const standardValidation = validateStandardContentPages(contentPages, bookType);
    errors.push(...standardValidation.errors);
    warnings.push(...standardValidation.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate ABC content pages (26 letters A-Z)
 */
function validateABCContentPages(
  contentPages: any[],
  letterCase: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expectedLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const foundLetters = new Set<string>();

  contentPages.forEach((page, index) => {
    const expectedLetter = expectedLetters[index];
    
    // Title format validation
    const titleValidation = validateABCPageTitle(page.title, letterCase);
    if (!titleValidation.valid) {
      errors.push(`Page ${page.pageNumber || index + 3}: ${titleValidation.error}`);
    }

    // Extract letter from title
    const letterMatch = page.title?.match(/^\(([A-Za-z])\)/);
    if (letterMatch) {
      const actualLetter = letterMatch[1].toUpperCase();
      foundLetters.add(actualLetter);
      
      // Sequence validation
      if (actualLetter !== expectedLetter) {
        errors.push(
          `Page ${page.pageNumber || index + 3}: Expected letter "${expectedLetter}", got "${actualLetter}"`
        );
      }
    }

    // Image prompt validation (if description exists)
    if (page.description) {
      const promptValidation = validateImagePrompt(page.description);
      if (!promptValidation.valid) {
        errors.push(`Page ${page.pageNumber || index + 3}: ${promptValidation.error}`);
      }
    }
  });

  // Check for complete alphabet
  const missingLetters = expectedLetters.filter(letter => !foundLetters.has(letter));
  if (missingLetters.length > 0) {
    errors.push(`Missing alphabet letters: ${missingLetters.join(', ')}`);
  }

  // Check for duplicate letters
  if (foundLetters.size < contentPages.length && contentPages.length === 26) {
    warnings.push('Duplicate letters detected in content pages');
  }

  return { errors, warnings };
}

/**
 * Validate standard content pages (10 pages for non-ABC books)
 */
function validateStandardContentPages(
  contentPages: any[],
  bookType: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate page number sequence (should be 3-12 for standard books)
  const expectedPageNumbers = Array.from({ length: 10 }, (_, i) => i + 3);
  
  contentPages.forEach((page, index) => {
    const expectedPageNum = expectedPageNumbers[index];
    
    // Check page number if present
    if (page.pageNumber && page.pageNumber !== expectedPageNum) {
      warnings.push(
        `Content page ${index + 1}: Expected pageNumber ${expectedPageNum}, got ${page.pageNumber}`
      );
    }

    // Validate title exists
    if (!page.title || page.title.trim() === '') {
      errors.push(`Content page ${index + 1} (Page ${expectedPageNum}): Missing title`);
    }

    // Validate description/image prompt exists
    if (!page.description || page.description.trim() === '') {
      errors.push(`Content page ${index + 1} (Page ${expectedPageNum}): Missing description/image prompt`);
    }
  });

  // Book-type specific validations
  if (bookType === 'numbers') {
    validateNumbersPages(contentPages, errors, warnings);
  } else if (bookType === 'colors') {
    validateColorsPages(contentPages, errors, warnings);
  }

  return { errors, warnings };
}

/**
 * Numbers book specific validation
 */
function validateNumbersPages(
  contentPages: any[],
  errors: string[],
  warnings: string[]
): void {
  contentPages.forEach((page, index) => {
    // Check for numeric digits in title
    const hasDigit = /\d/.test(page.title || '');
    if (!hasDigit) {
      warnings.push(
        `Numbers page ${index + 1}: Title should contain numeric digits, got "${page.title}"`
      );
    }
  });
}

/**
 * Colors book specific validation
 */
function validateColorsPages(
  contentPages: any[],
  errors: string[],
  warnings: string[]
): void {
  const colorKeywords = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];
  
  contentPages.forEach((page, index) => {
    const titleLower = (page.title || '').toLowerCase();
    const hasColor = colorKeywords.some(color => titleLower.includes(color));
    if (!hasColor) {
      warnings.push(
        `Colors page ${index + 1}: Title should contain a color name, got "${page.title}"`
      );
    }
  });
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
