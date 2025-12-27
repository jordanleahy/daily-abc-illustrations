/**
 * Utility to handle Lovable AI Gateway errors (402/429)
 */

export interface LovableAiError {
  isCreditsExhausted: boolean;
  isRateLimited: boolean;
  message: string;
}

/**
 * Parse an error from a Supabase function invoke that calls Lovable AI
 * Checks for 402 (credits exhausted) and 429 (rate limited) errors
 */
export function parseLovableAiError(error: any, data?: any): LovableAiError {
  const errorMessage = error?.message || data?.error || '';
  
  // Check for credits exhausted (402)
  const isCreditsExhausted = 
    errorMessage.includes('credits') ||
    errorMessage.includes('402') ||
    errorMessage.includes('Payment required');
  
  // Check for rate limit (429)
  const isRateLimited = 
    errorMessage.includes('Rate limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests');
  
  let message = 'Could not generate image';
  
  if (isCreditsExhausted) {
    message = 'Lovable AI credits exhausted. Please add credits in Settings → Workspace → Usage.';
  } else if (isRateLimited) {
    message = 'Rate limit exceeded. Please wait a moment and try again.';
  }
  
  return {
    isCreditsExhausted,
    isRateLimited,
    message
  };
}

/**
 * Get a user-friendly error message for Lovable AI errors
 */
export function getLovableAiErrorMessage(error: any, data?: any): string {
  return parseLovableAiError(error, data).message;
}
