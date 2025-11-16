/**
 * Template Processing Utility
 * 
 * Shared utility for safely processing agent templates by substituting variables
 * with book-specific data across edge functions.
 */

/**
 * Strip hex color codes from text while preserving natural color names
 * Example: "red #E43F3F badge" becomes "red badge"
 * Example: "ice blue (#E9F4FB)" becomes "ice blue"
 * Example: "warm wood tones #D9A066 behind them" becomes "warm wood tones behind them"
 */
export function stripHexCodes(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Remove hex codes with optional surrounding parentheses
  // Matches: #XXXXXX, (#XXXXXX), #XXX, (#XXX)
  let result = text
    .replace(/\(#[0-9A-Fa-f]{6}\)/g, '')           // Remove (#XXXXXX)
    .replace(/\(#[0-9A-Fa-f]{3}\)/g, '')            // Remove (#XXX)
    .replace(/#[0-9A-Fa-f]{6}(?!\w)/g, '')          // Remove standalone #XXXXXX
    .replace(/#[0-9A-Fa-f]{3}(?!\w)/g, '')          // Remove standalone #XXX
    .replace(/\(\s*\)/g, '')                        // Remove empty parentheses ()
    .replace(/\s+/g, ' ')                           // Normalize whitespace
    .trim();
  
  return result;
}

/**
 * Validate and replace skiing-related keywords with snowboarding terms for Bear Stories theme
 * Ensures style guide compliance: Bear Stories is ALWAYS about snowboarding, NEVER skiing
 * Bundle-optimized with simple string replacements
 */
export function enforceBearStoriesSnowboarding(text: string, styleGuideKey?: string): string {
  if (!text || styleGuideKey !== 'bear-stories') {
    return text;
  }
  
  let modified = text;
  let changed = false;
  
  // Simple case-insensitive replacements (bundle-friendly)
  const pairs = [
    ['skiing', 'snowboarding'],
    ['skier', 'snowboarder'],
    ['skiers', 'snowboarders'],
    ['ski pole', 'snowboard'],
    ['ski poles', 'snowboards'],
    ['skis', 'snowboards']
  ];
  
  for (const [from, to] of pairs) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    if (regex.test(modified)) {
      modified = modified.replace(regex, to);
      changed = true;
    }
  }
  
  // Handle standalone "ski" (not in "skills", "skillet" etc)
  const skiRegex = /\bski\b/gi;
  if (skiRegex.test(modified)) {
    modified = modified.replace(skiRegex, 'snowboard');
    changed = true;
  }
  
  if (changed) {
    console.warn('⚠️ Bear Stories: Auto-corrected skiing → snowboarding');
  }
  
  return modified;
}

/**
 * Safely processes agent template by substituting variables with book-specific data
 */
export function processAgentTemplate(
  template: string, 
  bookMetadata: any, 
  requestId: string
): { processedTemplate: string; variables: Record<string, string> } {
  if (!template || typeof template !== 'string') {
    console.log(`[${requestId}] Invalid template input, using original`);
    return { processedTemplate: template || '', variables: {} };
  }

  const sanitizeValue = (value: string | undefined | null, maxLength = 500): string => {
    if (!value) return '';
    
    let sanitized = String(value).trim()
      .replace(/[<>]/g, '')
      .replace(/\$\{.*?\}/g, '')
      .replace(/`/g, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength).trim();
    }
    
    return sanitized;
  };

  const templateVariables: Record<string, string> = {
    '<Category>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<Theme>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<CATEGORY>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<THEME>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<BOOK_NAME>': sanitizeValue(bookMetadata.book_name) || 'ABC Learning',
    '<BOOK_CATEGORY>': sanitizeValue(bookMetadata.category) || 'Educational',
    '<BOOK_DESCRIPTION>': sanitizeValue(bookMetadata.book_description, 200) || 'An educational ABC learning book',
  };

  try {
    let processedTemplate = template;
    const usedVariables: Record<string, string> = {};

    const escapeRegExp = (string: string): string => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    for (const variable of Object.keys(templateVariables)) {
      const value = templateVariables[variable];
      
      if (processedTemplate.includes(variable)) {
        processedTemplate = processedTemplate.replace(new RegExp(escapeRegExp(variable), 'g'), value);
        usedVariables[variable] = value;
      }
    }
    
    return { processedTemplate, variables: usedVariables };

  } catch (error) {
    console.error(`[${requestId}] Error processing template:`, error);
    return { processedTemplate: template, variables: {} };
  }
}