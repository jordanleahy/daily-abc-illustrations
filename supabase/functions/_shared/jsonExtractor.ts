/**
 * Shared JSON Extraction Utilities
 * Provides consistent JSON parsing and validation across all edge functions
 */

export interface JSONExtractionResult<T> {
  isValid: boolean;
  data?: T;
  rawText: string;
  extractionMethod: string;
  parseError?: string;
}

/**
 * Extract JSON from various text formats (markdown blocks, code blocks, raw JSON)
 * Uses multiple strategies to find and parse JSON content
 */
export function extractJSON<T>(
  rawText: string,
  validator?: (data: any) => data is T
): JSONExtractionResult<T> {
  let jsonStr = '';
  let extractionMethod = 'unknown';
  
  // Strategy 1: Extract from ```json markdown blocks
  let codeBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonStr = codeBlockMatch[1].trim();
    extractionMethod = 'markdown-json-block';
  } 
  // Strategy 2: Extract from generic ``` code blocks
  else if ((codeBlockMatch = rawText.match(/```\s*([\s\S]*?)\s*```/))) {
    jsonStr = codeBlockMatch[1].trim();
    extractionMethod = 'markdown-generic-block';
  }
  // Strategy 3: Find largest JSON object in response
  else {
    const jsonMatches = rawText.match(/\{[\s\S]*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Get the largest JSON-like string
      jsonStr = jsonMatches.reduce((a, b) => a.length > b.length ? a : b);
      extractionMethod = 'largest-json-object';
    } else {
      jsonStr = rawText;
      extractionMethod = 'raw-response';
    }
  }

  // Clean common formatting issues
  jsonStr = jsonStr
    .replace(/^\s*[\r\n]+/gm, '') // Remove extra newlines
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .trim();

  // Attempt to parse
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate if validator provided
    if (validator) {
      if (validator(parsed)) {
        return {
          isValid: true,
          data: parsed,
          rawText,
          extractionMethod
        };
      } else {
        return {
          isValid: false,
          rawText,
          extractionMethod,
          parseError: 'Validation failed - JSON structure does not match expected schema'
        };
      }
    }
    
    // No validator - return parsed data
    return {
      isValid: true,
      data: parsed,
      rawText,
      extractionMethod
    };
    
  } catch (error) {
    return {
      isValid: false,
      rawText,
      extractionMethod,
      parseError: error instanceof Error ? error.message : 'Unknown parse error'
    };
  }
}

/**
 * Extract and validate required keys from JSON
 */
export function validateRequiredKeys(
  data: any,
  requiredKeys: string[]
): { valid: boolean; missingKeys: string[] } {
  if (!data || typeof data !== 'object') {
    return { valid: false, missingKeys: requiredKeys };
  }
  
  const presentKeys = Object.keys(data);
  const missingKeys = requiredKeys.filter(key => !data[key]);
  
  return {
    valid: missingKeys.length === 0,
    missingKeys
  };
}
