/**
 * Template Processing Utility
 * 
 * Shared utility for safely processing agent templates by substituting variables
 * with book-specific data across edge functions.
 */

/**
 * Strip hex color codes from text while preserving natural color names
 * Example: "red #E43F3F badge" becomes "red badge"
 */
export function stripHexCodes(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Match hex codes: #XXXXXX or #XXX (where X is a hex digit)
  // Pattern captures both 6-digit and 3-digit hex codes
  return text.replace(/#[0-9A-Fa-f]{6}(?!\w)/g, '')  // 6-digit hex
             .replace(/#[0-9A-Fa-f]{3}(?!\w)/g, '')   // 3-digit hex
             .replace(/\s+/g, ' ')                      // Normalize whitespace
             .trim();
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

  const sanitizeValue = (value: string | undefined | null, maxLength = 100): string => {
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