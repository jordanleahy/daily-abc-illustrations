/**
 * AI Model Constants for Edge Functions
 * 
 * Centralized configuration for AI models and pricing used across all edge functions.
 * This ensures consistency and makes it easy to update models/pricing in one place.
 * 
 * Gateway endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
 */

// ============================================
// IMAGE GENERATION MODELS
// ============================================

/**
 * Standard image generation model (Gemini 2.5 Flash Image / Nano Banana)
 * Fast, cost-effective image generation
 */
export const IMAGE_GENERATION_MODEL = 'google/gemini-2.5-flash-image-preview';

/**
 * Pro image generation model (Gemini 3 Pro Image / Nano Banana Pro)
 * Higher quality, studio-grade images
 */
export const IMAGE_GENERATION_MODEL_PRO = 'google/gemini-3-pro-image-preview';

// ============================================
// TEXT/REASONING MODELS
// ============================================

/**
 * Default text model (Gemini 2.5 Flash)
 * Balanced speed and capability for general tasks
 */
export const DEFAULT_TEXT_MODEL = 'google/gemini-2.5-flash';

/**
 * Pro reasoning model (Gemini 2.5 Pro)
 * Higher accuracy for complex reasoning tasks
 */
export const PRO_TEXT_MODEL = 'google/gemini-2.5-pro';

/**
 * Lite text model (Gemini 2.5 Flash Lite)
 * Fastest and cheapest for simple tasks
 */
export const LITE_TEXT_MODEL = 'google/gemini-2.5-flash-lite';

// ============================================
// IMAGE GENERATION PRICING
// ============================================

/**
 * Flat rate cost per generated image in USD
 * Applies to both generate and edit operations
 */
export const IMAGE_GENERATION_COST_USD = 0.039;

/**
 * Pre-calculated cost in cents (for database storage)
 * Math.round(0.039 * 100) = 4 cents
 */
export const IMAGE_GENERATION_COST_CENTS = 4;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build usage metadata object for image generation operations
 * Standardized format for tracking in database
 */
export function buildImageGenerationMetadata(
  inputTokens: number,
  outputTokens: number,
  operationType: 'color_generation' | 'coloring_generation' | 'image_edit' | 'og_generation' = 'color_generation',
  additionalData?: Record<string, unknown>
): Record<string, unknown> {
  return {
    [operationType]: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      flat_rate_cost_usd: IMAGE_GENERATION_COST_USD,
      model: IMAGE_GENERATION_MODEL,
      generated_at: new Date().toISOString(),
      ...additionalData
    }
  };
}

/**
 * Log image generation usage in a consistent format
 */
export function logImageGenerationUsage(
  inputTokens: number,
  outputTokens: number,
  totalTokens: number
): void {
  console.log(`📊 AI Usage - Input: ${inputTokens} tokens, Output: ${outputTokens} tokens, Total: ${totalTokens} tokens`);
  console.log(`💰 Cost: $${IMAGE_GENERATION_COST_USD} (flat rate per image) = ${IMAGE_GENERATION_COST_CENTS} cents`);
  console.log(`🤖 Model: ${IMAGE_GENERATION_MODEL}`);
}
