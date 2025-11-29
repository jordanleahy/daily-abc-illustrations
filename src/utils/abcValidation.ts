/**
 * ABC Book Validation Utilities
 * Frontend validation to catch issues before sending to backend
 */

export interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

export interface ABCValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates ABC book page title format
 */
export function validateABCPageTitle(
  title: string,
  expectedLetter: string,
  letterCase: string
): { valid: boolean; error?: string } {
  // Check parentheses format
  const parenthesesPattern = /^\([A-Za-z]\)\s+is\s+for\s+\w+/i;
  if (!parenthesesPattern.test(title)) {
    return {
      valid: false,
      error: `Title must follow format "(letter) is for word", got: ${title}`,
    };
  }

  // Extract letter from title
  const letterMatch = title.match(/^\(([A-Za-z])\)/);
  if (!letterMatch) {
    return { valid: false, error: 'Could not extract letter from title' };
  }

  const actualLetter = letterMatch[1];

  // Validate letter matches expected
  if (actualLetter.toUpperCase() !== expectedLetter.toUpperCase()) {
    return {
      valid: false,
      error: `Expected letter ${expectedLetter}, got ${actualLetter}`,
    };
  }

  // Validate letter case
  if (letterCase === 'lowercase' && actualLetter !== actualLetter.toLowerCase()) {
    return {
      valid: false,
      error: `Lowercase selected but found uppercase: ${actualLetter}`,
    };
  }
  if (letterCase === 'uppercase' && actualLetter !== actualLetter.toUpperCase()) {
    return {
      valid: false,
      error: `Uppercase selected but found lowercase: ${actualLetter}`,
    };
  }

  return { valid: true };
}

/**
 * Validates image prompt format and content
 */
export function validateImagePrompt(prompt: string): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  const trimmed = prompt.trim();

  // Length validation
  if (trimmed.length < 50) {
    return {
      valid: false,
      error: `Prompt too short (${trimmed.length} chars, min 50)`,
    };
  }

  if (trimmed.length < 200) {
    return {
      valid: true,
      warning: `Prompt is short (${trimmed.length} chars, recommended 200-350)`,
    };
  }

  if (trimmed.length > 500) {
    return {
      valid: true,
      warning: `Prompt is long (${trimmed.length} chars, recommended 200-350)`,
    };
  }

  // Check for mandatory ending
  const mandatoryEnding = 'No text overlays. Clean illustration only.';
  if (!trimmed.endsWith(mandatoryEnding)) {
    return {
      valid: false,
      error: `Prompt must end with: "${mandatoryEnding}"`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive ABC book validation
 */
export function validateABCBook(
  pages: PageDetail[],
  letterCase: string = 'lowercase'
): ABCValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Page count validation
  if (pages.length !== 26) {
    errors.push(`Expected 26 content pages, got ${pages.length}`);
  }

  // Validate each page
  const expectedLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const foundLetters = new Set<string>();

  pages.forEach((page, index) => {
    const expectedLetter = expectedLetters[index];

    // Title validation
    const titleValidation = validateABCPageTitle(
      page.title,
      expectedLetter,
      letterCase
    );
    if (!titleValidation.valid) {
      errors.push(`Page ${index + 1}: ${titleValidation.error}`);
    } else {
      // Track found letters
      const letterMatch = page.title.match(/^\(([A-Za-z])\)/);
      if (letterMatch) {
        foundLetters.add(letterMatch[1].toUpperCase());
      }
    }

    // Image prompt validation
    const promptValidation = validateImagePrompt(page.description);
    if (!promptValidation.valid) {
      errors.push(`Page ${index + 1}: ${promptValidation.error}`);
    }
    if (promptValidation.warning) {
      warnings.push(`Page ${index + 1}: ${promptValidation.warning}`);
    }
  });

  // Check for complete alphabet
  const missingLetters = expectedLetters.filter(
    (letter) => !foundLetters.has(letter)
  );
  if (missingLetters.length > 0) {
    errors.push(`Missing letters: ${missingLetters.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
