/**
 * Lovable AI Gateway - Available Models Reference
 * 
 * This file documents all AI models available through the Lovable AI Gateway
 * for use in edge functions and AI-powered features.
 * 
 * Gateway endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
 */

export type AIModelCategory = 'text' | 'image' | 'reasoning';
export type AIProvider = 'google' | 'openai' | 'stability';
export type CostTier = 'low' | 'medium' | 'high' | 'premium';
export type SpeedTier = 'fast' | 'medium' | 'slow';

/**
 * Detailed pricing tier for image models with variable pricing
 */
export interface ImagePricingTier {
  resolution?: string;      // e.g., "1024x1024", "1K/2K", "4K", "256x256"
  quality?: string;         // e.g., "low", "medium", "high", "standard", "HD"
  mode?: string;            // e.g., "fast", "standard", "ultra" (for Imagen 4)
  price: number;            // Price in USD
}

/**
 * Complete pricing structure for image models
 */
export interface ImageModelPricing {
  basePrice: number;              // Default/typical price for simple lookups
  batch?: number;                 // Batch discount price
  tiers?: ImagePricingTier[];     // Detailed tier pricing
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  category: AIModelCategory;
  description: string;
  bestFor: string;
  costTier: CostTier;
  speedTier: SpeedTier;
  flatRateCostUsd?: number;       // Simple flat rate (kept for backward compatibility)
  imagePricing?: ImageModelPricing; // Detailed pricing for image models
  isDefault?: boolean;
}

/**
 * All available AI models through Lovable AI Gateway
 */
export const AI_MODELS: Record<string, AIModelInfo> = {
  // ============================================
  // GOOGLE TEXT/REASONING MODELS
  // ============================================
  
  'google/gemini-3-pro-preview': {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    category: 'reasoning',
    description: 'Newest flagship. Higher reasoning accuracy, larger context window, better multimodal grounding, and more reliable tool-use than 2.5 Pro. Slower and premium-priced.',
    bestFor: 'Advanced agents, complex research, long-horizon reasoning, multimodal analysis requiring high accuracy',
    costTier: 'premium',
    speedTier: 'slow'
  },
  
  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    category: 'reasoning',
    description: 'Smartest and most complex Gemini. High reasoning, large context, slower and most expensive.',
    bestFor: 'Deep reasoning, advanced coding, research, complex multimodal tasks',
    costTier: 'high',
    speedTier: 'slow'
  },
  
  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    category: 'text',
    description: 'Balanced model. Faster and cheaper than Pro but still capable of reasoning. Mid-range cost.',
    bestFor: 'Assistants, analysis, general workflows where speed + intelligence balance matters',
    costTier: 'medium',
    speedTier: 'medium',
    isDefault: true
  },
  
  'google/gemini-2.5-flash-lite': {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    category: 'text',
    description: 'Fastest and cheapest Gemini. Handles simple tasks at scale, less reasoning depth.',
    bestFor: 'High-volume, lightweight tasks like classification, summarization, translation',
    costTier: 'low',
    speedTier: 'fast'
  },

  // ============================================
  // GOOGLE IMAGE MODELS
  // ============================================
  
  'google/gemini-3-pro-image-preview': {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Nano Banana Pro (Gemini 3 Pro Image)',
    provider: 'google',
    category: 'image',
    description: 'Image-generation and editing model built on Gemini 3 Pro\'s image architecture. Studio-quality, high-res visuals, optimized for text in images and multi-image composition.',
    bestFor: 'Visual asset creation, high-volume image workflows, infographics, rapid prototyping of design/creative content',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.134, // 1K/2K resolution default
    imagePricing: {
      basePrice: 0.134,
      batch: 0.067,
      tiers: [
        { resolution: '1K/2K', price: 0.134 },
        { resolution: '4K', price: 0.24 }
      ]
    }
  },
  
  'google/gemini-2.5-flash-image-preview': {
    id: 'google/gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash Image (Nano Banana)',
    provider: 'google',
    category: 'image',
    description: 'Optimized for generating images. Very cheap per image, not meant for text reasoning.',
    bestFor: 'Image generation, quick visual outputs',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.039,
    imagePricing: {
      basePrice: 0.039,
      batch: 0.0195
    }
  },
  
  'google/gemini-2.0-flash': {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    category: 'image',
    description: 'Previous generation Flash model with image capabilities. Same pricing as 2.5 Flash Image.',
    bestFor: 'Legacy image generation workflows',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.039,
    imagePricing: {
      basePrice: 0.039,
      batch: 0.0195
    }
  },
  
  'google/imagen-4': {
    id: 'google/imagen-4',
    name: 'Imagen 4',
    provider: 'google',
    category: 'image',
    description: 'Google\'s latest Imagen model with fast, standard, and ultra modes for different quality/speed tradeoffs.',
    bestFor: 'High-quality image generation with flexible speed/quality options',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.04, // Standard mode default
    imagePricing: {
      basePrice: 0.04,
      tiers: [
        { mode: 'fast', price: 0.02 },
        { mode: 'standard', price: 0.04 },
        { mode: 'ultra', price: 0.06 }
      ]
    }
  },
  
  'google/imagen-3': {
    id: 'google/imagen-3',
    name: 'Imagen 3',
    provider: 'google',
    category: 'image',
    description: 'Previous generation Imagen model. Standard quality image generation.',
    bestFor: 'Standard image generation tasks',
    costTier: 'low',
    speedTier: 'medium',
    flatRateCostUsd: 0.03,
    imagePricing: {
      basePrice: 0.03
    }
  },
  
  // ============================================
  // OPENAI TEXT/REASONING MODELS
  // ============================================
  
  'openai/gpt-5': {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    category: 'reasoning',
    description: 'Smartest OpenAI model. Strong reasoning, very accurate, but slowest and most expensive.',
    bestFor: 'Highest-quality reasoning, accuracy-critical apps, complex decision making',
    costTier: 'premium',
    speedTier: 'slow'
  },
  
  'openai/gpt-5-mini': {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    category: 'text',
    description: 'Balanced GPT-5. Cheaper and faster than GPT-5, less complex but strong general use.',
    bestFor: 'Assistants, mid-complexity reasoning, business workflows',
    costTier: 'medium',
    speedTier: 'medium'
  },
  
  'openai/gpt-5-nano': {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    category: 'text',
    description: 'Cheapest and fastest GPT-5. Very basic reasoning, best for quick or simple responses.',
    bestFor: 'Quick or simple responses, high-volume simple tasks',
    costTier: 'low',
    speedTier: 'fast'
  },

  // ============================================
  // OPENAI IMAGE MODELS
  // ============================================
  
  'openai/gpt-image-1.5': {
    id: 'openai/gpt-image-1.5',
    name: 'GPT Image 1.5',
    provider: 'openai',
    category: 'image',
    description: 'Latest GPT image model with low, medium, and high quality options at various resolutions.',
    bestFor: 'Flexible quality/cost image generation',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.034, // Medium quality 1024x1024 default
    imagePricing: {
      basePrice: 0.034,
      tiers: [
        { quality: 'low', resolution: '1024x1024', price: 0.009 },
        { quality: 'low', resolution: '1024x1536', price: 0.013 },
        { quality: 'low', resolution: '1536x1024', price: 0.013 },
        { quality: 'medium', resolution: '1024x1024', price: 0.034 },
        { quality: 'medium', resolution: '1024x1536', price: 0.05 },
        { quality: 'medium', resolution: '1536x1024', price: 0.05 },
        { quality: 'high', resolution: '1024x1024', price: 0.133 },
        { quality: 'high', resolution: '1024x1536', price: 0.2 },
        { quality: 'high', resolution: '1536x1024', price: 0.2 }
      ]
    }
  },
  
  'openai/gpt-image-latest': {
    id: 'openai/gpt-image-latest',
    name: 'GPT Image Latest',
    provider: 'openai',
    category: 'image',
    description: 'Always points to the latest GPT image model. Same pricing structure as GPT Image 1.5.',
    bestFor: 'Always using the newest OpenAI image capabilities',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.034,
    imagePricing: {
      basePrice: 0.034,
      tiers: [
        { quality: 'low', resolution: '1024x1024', price: 0.009 },
        { quality: 'low', resolution: '1024x1536', price: 0.013 },
        { quality: 'low', resolution: '1536x1024', price: 0.013 },
        { quality: 'medium', resolution: '1024x1024', price: 0.034 },
        { quality: 'medium', resolution: '1024x1536', price: 0.05 },
        { quality: 'medium', resolution: '1536x1024', price: 0.05 },
        { quality: 'high', resolution: '1024x1024', price: 0.133 },
        { quality: 'high', resolution: '1024x1536', price: 0.2 },
        { quality: 'high', resolution: '1536x1024', price: 0.2 }
      ]
    }
  },
  
  'openai/gpt-image-1': {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    provider: 'openai',
    category: 'image',
    description: 'First generation GPT image model. Slightly higher pricing than 1.5.',
    bestFor: 'Legacy image generation workflows',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.042,
    imagePricing: {
      basePrice: 0.042,
      tiers: [
        { quality: 'low', resolution: '1024x1024', price: 0.011 },
        { quality: 'low', resolution: '1024x1536', price: 0.016 },
        { quality: 'low', resolution: '1536x1024', price: 0.016 },
        { quality: 'medium', resolution: '1024x1024', price: 0.042 },
        { quality: 'medium', resolution: '1024x1536', price: 0.063 },
        { quality: 'medium', resolution: '1536x1024', price: 0.063 },
        { quality: 'high', resolution: '1024x1024', price: 0.167 },
        { quality: 'high', resolution: '1024x1536', price: 0.25 },
        { quality: 'high', resolution: '1536x1024', price: 0.25 }
      ]
    }
  },
  
  'openai/gpt-image-1-mini': {
    id: 'openai/gpt-image-1-mini',
    name: 'GPT Image 1 Mini',
    provider: 'openai',
    category: 'image',
    description: 'Smaller, faster, and cheaper version of GPT Image 1. Good for quick iterations.',
    bestFor: 'Budget-friendly image generation, rapid prototyping',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.011,
    imagePricing: {
      basePrice: 0.011,
      tiers: [
        { quality: 'low', resolution: '1024x1024', price: 0.005 },
        { quality: 'low', resolution: '1024x1536', price: 0.006 },
        { quality: 'low', resolution: '1536x1024', price: 0.006 },
        { quality: 'medium', resolution: '1024x1024', price: 0.011 },
        { quality: 'medium', resolution: '1024x1536', price: 0.015 },
        { quality: 'medium', resolution: '1536x1024', price: 0.015 },
        { quality: 'high', resolution: '1024x1024', price: 0.036 },
        { quality: 'high', resolution: '1024x1536', price: 0.052 },
        { quality: 'high', resolution: '1536x1024', price: 0.052 }
      ]
    }
  },
  
  'openai/dall-e-3': {
    id: 'openai/dall-e-3',
    name: 'DALL·E 3',
    provider: 'openai',
    category: 'image',
    description: 'OpenAI\'s DALL·E 3 model with Standard and HD quality options.',
    bestFor: 'High-quality artistic image generation',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.04, // Standard 1024x1024 default
    imagePricing: {
      basePrice: 0.04,
      tiers: [
        { quality: 'standard', resolution: '1024x1024', price: 0.04 },
        { quality: 'standard', resolution: '1024x1792', price: 0.08 },
        { quality: 'standard', resolution: '1792x1024', price: 0.08 },
        { quality: 'HD', resolution: '1024x1024', price: 0.08 },
        { quality: 'HD', resolution: '1024x1792', price: 0.12 },
        { quality: 'HD', resolution: '1792x1024', price: 0.12 }
      ]
    }
  },
  
  'openai/dall-e-2': {
    id: 'openai/dall-e-2',
    name: 'DALL·E 2',
    provider: 'openai',
    category: 'image',
    description: 'Legacy DALL·E 2 model. Cheapest OpenAI image option.',
    bestFor: 'Budget image generation, legacy workflows',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.02, // 1024x1024 default
    imagePricing: {
      basePrice: 0.02,
      tiers: [
        { resolution: '256x256', price: 0.016 },
        { resolution: '512x512', price: 0.018 },
        { resolution: '1024x1024', price: 0.02 }
      ]
    }
  },

  // ============================================
  // STABILITY AI MODELS
  // ============================================
  
  'stability/stable-image-ultra': {
    id: 'stability/stable-image-ultra',
    name: 'Stable Image Ultra',
    provider: 'stability',
    category: 'image',
    description: 'Stability AI\'s highest quality image model. Premium pricing for best results.',
    bestFor: 'Premium quality image generation, professional artwork',
    costTier: 'high',
    speedTier: 'slow',
    flatRateCostUsd: 0.08,
    imagePricing: {
      basePrice: 0.08
    }
  },
  
  'stability/stable-diffusion-3.5-large': {
    id: 'stability/stable-diffusion-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'stability',
    category: 'image',
    description: 'Large SD 3.5 model. High quality with good detail.',
    bestFor: 'High-quality image generation with fine details',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.065,
    imagePricing: {
      basePrice: 0.065
    }
  },
  
  'stability/stable-diffusion-3.5-large-turbo': {
    id: 'stability/stable-diffusion-3.5-large-turbo',
    name: 'Stable Diffusion 3.5 Large Turbo',
    provider: 'stability',
    category: 'image',
    description: 'Faster version of SD 3.5 Large. Good balance of speed and quality.',
    bestFor: 'Fast high-quality image generation',
    costTier: 'medium',
    speedTier: 'fast',
    flatRateCostUsd: 0.04,
    imagePricing: {
      basePrice: 0.04
    }
  },
  
  'stability/stable-diffusion-3.5-medium': {
    id: 'stability/stable-diffusion-3.5-medium',
    name: 'Stable Diffusion 3.5 Medium',
    provider: 'stability',
    category: 'image',
    description: 'Medium-sized SD 3.5 model. Good balance of cost and quality.',
    bestFor: 'Balanced image generation for most use cases',
    costTier: 'low',
    speedTier: 'medium',
    flatRateCostUsd: 0.035,
    imagePricing: {
      basePrice: 0.035
    }
  },
  
  'stability/stable-diffusion-3.5-flash': {
    id: 'stability/stable-diffusion-3.5-flash',
    name: 'Stable Diffusion 3.5 Flash',
    provider: 'stability',
    category: 'image',
    description: 'Fastest SD 3.5 model. Optimized for speed over quality.',
    bestFor: 'Rapid image generation, prototyping',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.025,
    imagePricing: {
      basePrice: 0.025
    }
  },
  
  'stability/stable-image-core': {
    id: 'stability/stable-image-core',
    name: 'Stable Image Core',
    provider: 'stability',
    category: 'image',
    description: 'Core Stable Image model. Good all-around performance.',
    bestFor: 'General purpose image generation',
    costTier: 'low',
    speedTier: 'medium',
    flatRateCostUsd: 0.03,
    imagePricing: {
      basePrice: 0.03
    }
  },
  
  'stability/sdxl-1.0': {
    id: 'stability/sdxl-1.0',
    name: 'SDXL 1.0',
    provider: 'stability',
    category: 'image',
    description: 'Stable Diffusion XL 1.0. Cheapest Stability AI option.',
    bestFor: 'Budget image generation, high-volume workflows',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.009,
    imagePricing: {
      basePrice: 0.009
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get model info by ID
 */
export const getModelById = (id: string): AIModelInfo | undefined => AI_MODELS[id];

/**
 * Get all image generation models
 */
export const getImageModels = (): AIModelInfo[] => 
  Object.values(AI_MODELS).filter(m => m.category === 'image');

/**
 * Get all text/reasoning models
 */
export const getTextModels = (): AIModelInfo[] => 
  Object.values(AI_MODELS).filter(m => m.category === 'text' || m.category === 'reasoning');

/**
 * Get the default model (Gemini 2.5 Flash)
 */
export const getDefaultModel = (): AIModelInfo => AI_MODELS['google/gemini-2.5-flash'];

/**
 * Get models by provider
 */
export const getModelsByProvider = (provider: AIProvider): AIModelInfo[] =>
  Object.values(AI_MODELS).filter(m => m.provider === provider);

/**
 * Get models by cost tier
 */
export const getModelsByCostTier = (tier: CostTier): AIModelInfo[] =>
  Object.values(AI_MODELS).filter(m => m.costTier === tier);

/**
 * Get flat rate cost for image models (in USD)
 */
export const getImageModelCost = (modelId: string): number | undefined => {
  const model = AI_MODELS[modelId];
  return model?.flatRateCostUsd;
};

/**
 * Get detailed pricing for an image model
 */
export const getImageModelPricing = (modelId: string): ImageModelPricing | undefined => {
  const model = AI_MODELS[modelId];
  return model?.imagePricing;
};

/**
 * Get price for a specific tier (resolution, quality, mode)
 */
export const getImageTierPrice = (
  modelId: string,
  options?: { resolution?: string; quality?: string; mode?: string }
): number | undefined => {
  const pricing = getImageModelPricing(modelId);
  if (!pricing) return undefined;
  
  // If no options specified, return base price
  if (!options || (!options.resolution && !options.quality && !options.mode)) {
    return pricing.basePrice;
  }
  
  // Search through tiers
  const tier = pricing.tiers?.find(t => {
    if (options.resolution && t.resolution !== options.resolution) return false;
    if (options.quality && t.quality !== options.quality) return false;
    if (options.mode && t.mode !== options.mode) return false;
    return true;
  });
  
  return tier?.price ?? pricing.basePrice;
};

// ============================================
// PROJECT-SPECIFIC MODEL CONFIGURATION
// ============================================

/**
 * Models currently used in this project
 * Update this when changing models in edge functions
 */
export const PROJECT_MODELS = {
  /** Used for standard color image generation */
  imageGeneration: 'google/gemini-2.5-flash-image-preview',
  
  /** Used for pro/high-quality image generation (cover, educational pages) */
  imageGenerationPro: 'google/gemini-3-pro-image-preview',
  
  /** Used for image editing (edit-color-image) */
  imageEditing: 'google/gemini-2.5-flash-image-preview',
  
  /** Used for coloring book conversion (generate-coloring-image) */
  coloringImageGeneration: 'google/gemini-2.5-flash-image-preview',
  
  /** Used for chat/book creation agents */
  chat: 'google/gemini-2.5-flash',
  
  /** Used for prompt enhancement */
  promptEnhancement: 'google/gemini-2.5-flash',
  
  /** Used for agent change detection */
  agentAnalysis: 'google/gemini-2.5-flash'
} as const;

/**
 * Get the cost per image for project image generation (in cents)
 */
export const getProjectImageCostCents = (): number => {
  const model = AI_MODELS[PROJECT_MODELS.imageGeneration];
  const costUsd = model?.flatRateCostUsd ?? 0.039;
  return Math.round(costUsd * 100);
};

/**
 * Get the cost per image for pro model (in cents)
 */
export const getProjectProImageCostCents = (): number => {
  const model = AI_MODELS[PROJECT_MODELS.imageGenerationPro];
  const costUsd = model?.flatRateCostUsd ?? 0.134;
  return Math.round(costUsd * 100);
};

// ============================================
// MODEL EQUIVALENTS (for reference)
// ============================================

/**
 * Model equivalents between providers
 * Useful when switching between providers
 */
export const MODEL_EQUIVALENTS = {
  'openai/gpt-5': 'google/gemini-2.5-pro',
  'openai/gpt-5-mini': 'google/gemini-2.5-flash',
  'openai/gpt-5-nano': 'google/gemini-2.5-flash-lite'
} as const;
