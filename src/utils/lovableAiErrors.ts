/**
 * Utility to handle Lovable AI Gateway errors (402/429/422)
 */

export interface LovableAiError {
  isCreditsExhausted: boolean;
  isRateLimited: boolean;
  isNoImageGenerated: boolean;
  message: string;
}

/**
 * Parse an error from a Supabase function invoke that calls Lovable AI
 * Checks for 402 (credits exhausted), 429 (rate limited), and 422 (no image generated) errors
 */
export function parseLovableAiError(error: any, data?: any): LovableAiError {
  const errorMessage = error?.message || data?.error || '';
  const errorCode = data?.errorCode || '';
  
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
  
  // Check for no image generated (422)
  const isNoImageGenerated = 
    errorCode === 'NO_IMAGE_GENERATED' ||
    errorMessage.includes('couldn\'t generate');
  
  let message = 'Could not generate image';
  
  if (isCreditsExhausted) {
    message = 'Lovable AI credits exhausted. Please add credits in Settings → Workspace → Usage.';
  } else if (isRateLimited) {
    message = 'Rate limit exceeded. Please wait a moment and try again.';
  } else if (isNoImageGenerated) {
    message = 'The AI couldn\'t generate the edited image. Try a different edit prompt.';
  }
  
  return {
    isCreditsExhausted,
    isRateLimited,
    isNoImageGenerated,
    message
  };
}

/**
 * Get a user-friendly error message for Lovable AI errors
 */
export function getLovableAiErrorMessage(error: any, data?: any): string {
  return parseLovableAiError(error, data).message;
}
