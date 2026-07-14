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
  // Collect every place a message could hide, in priority order.
  const specificMessage: string =
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.error?.message === 'string' && data.error.message) ||
    (typeof data?.message === 'string' && data.message) ||
    (typeof error?.context?.error === 'string' && error.context.error) ||
    (typeof error?.message === 'string' && error.message) ||
    '';
  const errorCode = data?.errorCode || data?.error?.code || '';
  const haystack = `${specificMessage} ${errorCode}`.toLowerCase();

  // Check for credits exhausted (402)
  const isCreditsExhausted =
    haystack.includes('credits') ||
    haystack.includes('402') ||
    haystack.includes('payment required');

  // Check for rate limit (429)
  const isRateLimited =
    haystack.includes('rate limit') ||
    haystack.includes('429') ||
    haystack.includes('too many requests');

  // Check for no image generated (422)
  const isNoImageGenerated =
    errorCode === 'NO_IMAGE_GENERATED' ||
    haystack.includes("couldn't generate") ||
    haystack.includes('no image');

  // Content moderation (OpenAI image policy blocks — character IP, etc.)
  const isModerationBlocked =
    haystack.includes('content_policy_violation') ||
    haystack.includes('moderation_blocked') ||
    haystack.includes('safety') ||
    haystack.includes('policy violation');

  let message: string;
  if (isCreditsExhausted) {
    message = 'Lovable AI credits exhausted. Please add credits in Settings → Workspace → Usage.';
  } else if (isRateLimited) {
    message = 'Rate limit exceeded. Please wait a moment and try again.';
  } else if (isModerationBlocked) {
    message = 'The image prompt was blocked by content safety (often character names like Bluey or Elsa). Try a descriptive version without the character name.';
  } else if (isNoImageGenerated) {
    message = "The AI couldn't generate the edited image. Try a different edit prompt.";
  } else if (specificMessage) {
    // Surface the real underlying error instead of hiding it behind a generic string.
    message = specificMessage;
  } else {
    message = 'Could not generate image';
  }

  return {
    isCreditsExhausted,
    isRateLimited,
    isNoImageGenerated,
    message,
  };
}

/**
 * Get a user-friendly error message for Lovable AI errors
 */
export function getLovableAiErrorMessage(error: any, data?: any): string {
  return parseLovableAiError(error, data).message;
}

