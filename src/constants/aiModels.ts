/**
 * Lovable AI Gateway - Available Models Reference
 * 
 * This file documents all AI models available through the Lovable AI Gateway
 * for use in edge functions and AI-powered features.
 * 
 * Gateway endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
 */

export type AIModelCategory = 'text' | 'image' | 'reasoning';
export type AIProvider = 'google' | 'openai';
export type CostTier = 'low' | 'medium' | 'high' | 'premium';
export type SpeedTier = 'fast' | 'medium' | 'slow';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  category: AIModelCategory;
  description: string;
  bestFor: string;
  costTier: CostTier;
  speedTier: SpeedTier;
  flatRateCostUsd?: number; // For image models (per image output)
  isDefault?: boolean;
}

/**
 * All available AI models through Lovable AI Gateway
 */
export const AI_MODELS: Record<string, AIModelInfo> = {
  // ============================================
  // GOOGLE MODELS
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
  
  'google/gemini-3-pro-image-preview': {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Nano Banana Pro',
    provider: 'google',
    category: 'image',
    description: 'Image-generation and editing model built on Gemini 3 Pro\'s image architecture. Studio-quality, high-res visuals, optimized for text in images and multi-image composition.',
    bestFor: 'Visual asset creation, high-volume image workflows, infographics, rapid prototyping of design/creative content',
    costTier: 'medium',
    speedTier: 'medium',
    flatRateCostUsd: 0.039 // Estimate - verify actual pricing
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
  
  'google/gemini-2.5-flash-image-preview': {
    id: 'google/gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash Image (Nano Banana)',
    provider: 'google',
    category: 'image',
    description: 'Optimized for generating images. Very cheap per image, not meant for text reasoning.',
    bestFor: 'Image generation, quick visual outputs',
    costTier: 'low',
    speedTier: 'fast',
    flatRateCostUsd: 0.039
  },
  
  // ============================================
  // OPENAI MODELS
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

// ============================================
// PROJECT-SPECIFIC MODEL CONFIGURATION
// ============================================

/**
 * Models currently used in this project
 * Update this when changing models in edge functions
 */
export const PROJECT_MODELS = {
  /** Used for color image generation (generate-color-image) */
  imageGeneration: 'google/gemini-2.5-flash-image-preview',
  
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
