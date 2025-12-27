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
 * Standard model (Gemini 2.5 Flash Image) pricing
 * Flat rate cost per generated image in USD
 */
export const IMAGE_GENERATION_COST_USD = 0.039;

/**
 * Standard model cost in cents (for database storage)
 * Math.round(0.039 * 100) = 4 cents
 */
export const IMAGE_GENERATION_COST_CENTS = 4;

/**
 * Pro model (Gemini 3 Pro Image / Nano Banana Pro) pricing
 * Using 1K/2K resolution pricing as default
 */
export const IMAGE_GENERATION_PRO_COST_USD = 0.134;

/**
 * Pro model cost in cents (for database storage)
 * Math.round(0.134 * 100) = 13 cents
 */
export const IMAGE_GENERATION_PRO_COST_CENTS = 13;

/**
 * Pro model 4K resolution pricing (when applicable)
 */
export const IMAGE_GENERATION_PRO_4K_COST_USD = 0.24;
export const IMAGE_GENERATION_PRO_4K_COST_CENTS = 24;

// ============================================
// DYNAMIC COST LOOKUP
// ============================================

/**
 * Get image generation cost by model ID
 * Returns both USD and cents values for the given model
 */
export function getImageCostByModel(model: string): { usd: number; cents: number } {
  switch (model) {
    case IMAGE_GENERATION_MODEL_PRO:
      return { usd: IMAGE_GENERATION_PRO_COST_USD, cents: IMAGE_GENERATION_PRO_COST_CENTS };
    case IMAGE_GENERATION_MODEL:
    default:
      return { usd: IMAGE_GENERATION_COST_USD, cents: IMAGE_GENERATION_COST_CENTS };
  }
}

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
  model: string = IMAGE_GENERATION_MODEL,
  additionalData?: Record<string, unknown>
): Record<string, unknown> {
  const { usd: costUsd } = getImageCostByModel(model);
  
  return {
    [operationType]: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      flat_rate_cost_usd: costUsd,
      model: model,
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
  totalTokens: number,
  model: string = IMAGE_GENERATION_MODEL
): void {
  const { usd, cents } = getImageCostByModel(model);
  console.log(`📊 AI Usage - Input: ${inputTokens} tokens, Output: ${outputTokens} tokens, Total: ${totalTokens} tokens`);
  console.log(`💰 Cost: $${usd} (flat rate per image) = ${cents} cents`);
  console.log(`🤖 Model: ${model}`);
}
