/**
 * Character Theme validation utilities
 * Synced with frontend CharacterTheme enum in src/types/characterTheme.ts
 */
export const VALID_CHARACTER_THEMES = [
  'paw-patrol', 'frozen', 'peppa-pig', 'bluey', 'cocomelon', 
  'moana', 'mickey-mouse', 'mario', 'sesame-street', 
  'benji-davies', 'black-and-white', 'bear-stories', 'dora',
  'custom', 'no-theme'
] as const;

export type ValidCharacterTheme = typeof VALID_CHARACTER_THEMES[number];

/**
 * Normalizes and validates a character theme string
 * Converts to kebab-case and validates against known themes
 * @param theme - Theme string to normalize
 * @returns Validated theme or undefined if invalid
 */
export function normalizeTheme(theme: string | undefined): ValidCharacterTheme | undefined {
  if (!theme) return undefined;
  
  // Convert to kebab-case
  const normalized = theme.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Validate against known themes
  if (VALID_CHARACTER_THEMES.includes(normalized as ValidCharacterTheme)) {
    return normalized as ValidCharacterTheme;
  }
  
  console.warn(`[Theme Validation] Invalid theme: "${theme}", normalized to: "${normalized}"`);
  return undefined;
}

/**
 * Book Type validation utilities
 * Synced with frontend BookTypeId in src/types/bookType.ts
 */
export const VALID_BOOK_TYPES = [
  'abc',
  'numbers', 
  'shapes',
  'colors',
  'rhyming',
  'opposites',
  'emotions',
  'animals',
  'first-words',
  'bedtime',
  'cvc',
  'sight-words',
  'general',
  'digraphs',
  'parent-education',
  'other'
] as const;

export type ValidBookType = typeof VALID_BOOK_TYPES[number];

/**
 * Normalizes and validates a book type string
 * Converts to kebab-case and validates against known types
 * @param bookType - Book type string to normalize
 * @returns Validated book type or 'other' as fallback
 */
export function normalizeBookType(bookType: string | undefined): ValidBookType {
  if (!bookType) return 'other';
  
  // Convert to kebab-case
  const normalized = bookType.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Validate against known types
  if (VALID_BOOK_TYPES.includes(normalized as ValidBookType)) {
    return normalized as ValidBookType;
  }
  
  console.warn(`[Book Type Validation] Invalid book type: "${bookType}", normalized to: "${normalized}", defaulting to 'other'`);
  return 'other';
}

// ============================================
// Age Range Validation
// ============================================

/**
 * Valid age range IDs (must match frontend enum)
 */
export const VALID_AGE_RANGES = [
  '0-2',
  '2-4',
  '4-6',
  '6-8',
  '8-10',
  '10-12',
  'other'
] as const;

export type ValidAgeRange = typeof VALID_AGE_RANGES[number];

/**
 * Normalizes and validates an age range string
 * @param ageRange - Age range string to normalize
 * @returns Validated age range or undefined if invalid
 */
export function normalizeAgeRange(ageRange: string | undefined): ValidAgeRange | undefined {
  if (!ageRange) return undefined;
  
  // Convert to lowercase and trim
  const normalized = ageRange.toLowerCase().trim();
  
  // Validate against known ranges
  if (VALID_AGE_RANGES.includes(normalized as ValidAgeRange)) {
    return normalized as ValidAgeRange;
  }
  
  // Try to extract numbers and format (e.g., "2 to 4" -> "2-4")
  const numbers = normalized.match(/(\d+)/g);
  if (numbers && numbers.length >= 2) {
    const formatted = `${numbers[0]}-${numbers[1]}`;
    if (VALID_AGE_RANGES.includes(formatted as ValidAgeRange)) {
      return formatted as ValidAgeRange;
    }
  }
  
  console.warn(`[Age Range Validation] Invalid age range: "${ageRange}", normalized to: "${normalized}"`);
  return undefined;
}

/**
 * Validates and normalizes number ranges for number books
 * Accepts any range with exactly 10 consecutive integers (inclusive)
 * Examples: "1-10", "10-20", "30-40", "60-70" are all valid
 * 
 * @param range - Number range string to validate (format: "start-end")
 * @returns Validated range string or undefined if invalid
 * 
 * Security: Validates input format, range bounds, and span to prevent injection
 */
export function validateNumberRange(range: string | undefined): string | undefined {
  if (!range) return undefined;
  
  // Sanitize and trim input
  const trimmed = range.trim();
  
  // Match pattern: number-number (e.g., "1-10", "30-40")
  // Only allows digits and single hyphen to prevent injection
  const rangePattern = /^(\d+)-(\d+)$/;
  const match = trimmed.match(rangePattern);
  
  if (!match) {
    console.warn(`[Number Range Validation] Invalid format: "${range}" (expected format: "start-end")`);
    return undefined;
  }
  
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  
  // Validate: end must be greater than start
  if (end <= start) {
    console.warn(`[Number Range Validation] End must be greater than start: "${range}"`);
    return undefined;
  }
  
  // Validate: must be exactly 10 integers (inclusive)
  // For range "10-20", we have 11 numbers: 10,11,12,13,14,15,16,17,18,19,20
  // So we check if (end - start) === 10
  const span = end - start;
  if (span !== 10) {
    console.warn(`[Number Range Validation] Range must span exactly 10 integers: "${range}" spans ${span}`);
    return undefined;
  }
  
  // Validate: reasonable bounds (0-999 to prevent extreme values)
  if (start < 0 || end > 999) {
    console.warn(`[Number Range Validation] Numbers must be between 0-999: "${range}"`);
    return undefined;
  }
  
  console.log(`[Number Range Validation] Valid range: "${trimmed}" (${start} to ${end}, inclusive = ${span + 1} numbers)`);
  return trimmed;
}

/**
 * Shared types and utilities for Supabase Edge Functions
 * 
 * This file contains common types, enums, and utility functions used across
 * all edge functions to ensure consistency and reduce code duplication.
 * 
 * NOTE: These status enums are mirrored in src/types/shared/status.ts for frontend use.
 * Edge functions cannot import from src/ due to Deno runtime, so these enums are duplicated.
 * Keep both files synchronized when making changes to status enums.
 */

/**
 * Enumeration representing the status of a process or operation
 * Used throughout edge functions for consistent status tracking
 */
export enum ProcessStatus {
  /** Process has not been initiated */
  NOT_STARTED = 'not-started',
  /** Process is currently running */
  IN_PROGRESS = 'in-progress', 
  /** Process completed successfully */
  COMPLETE = 'complete',
  /** Process failed with an error */
  ERROR = 'error',
  /** Process completed but with warnings */
  WARNING = 'warning',
  /** Process was intentionally skipped */
  SKIPPED = 'skipped'
}

/**
 * Standard CORS headers used by all edge functions
 * Enables cross-origin requests from web browsers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Structured logging function for edge functions
 * Provides consistent logging format across all edge functions for monitoring and debugging
 * 
 * @param level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param status - Current process status
 * @param step - Current operation step identifier
 * @param message - Human-readable log message
 * @param extra - Additional context data to log
 * @returns ISO timestamp string
 */
export const log = (level: string, status: ProcessStatus, step: string, message: string, extra?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${status}] [${step}] - ${message}`;
  console.log(logMessage, extra ? JSON.stringify(extra, null, 2) : '');
  return timestamp;
};

/**
 * Generates unique request IDs for tracking operations across edge functions
 * Format: req-{timestamp}-{random9chars}
 * 
 * @returns Unique request identifier string
 */
export const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Determines if an OpenAI model uses legacy parameter format
 * Legacy models use 'max_tokens' and support 'temperature' parameter
 * New models use 'max_completion_tokens' and don't support 'temperature'
 * 
 * @param model - OpenAI model name
 * @returns true if model uses legacy parameters
 */
export const isLegacyModel = (model: string) => model === 'gpt-4o' || model === 'gpt-4o-mini';

/**
 * Publication status enum for content lifecycle management
 * Used across books, pages, and other publishable content
 */
export enum PublicationStatus {
  /** Content is being created/edited and not visible to public */
  DRAFT = 'draft',
  /** Content is live and available to users */
  PUBLISHED = 'published',
  /** Content is hidden from normal view but retained */
  ARCHIVED = 'archived'
}

/**
 * Page type enum matching database enum
 * NOTE: Must stay in sync with src/types/book.ts PageType
 */
export type PageType = 'cover' | 'educational' | 'content';

/**
 * AI provider types
 * NOTE: Must stay in sync with src/types/shared/agent.ts
 * Edge functions run in Deno, frontend types run in different environment
 */
export type AIProvider = 'openai' | 'deepseek' | 'google';

/**
 * Agent configuration structure for edge functions
 * Represents a configured AI agent with its behavior and model settings
 */
/**
 * Agent type enumeration matching frontend types
 */
export type AgentType = 
  | 'chat' 
  | 'book-creation'
  | 'book-creation-numbers'
  | 'book-creation-rhyming'
  | 'book-creation-colors'
  | 'book-creation-abc'
  | 'book-creation-shapes'
  | 'book-creation-animals'
  | 'book-creation-sight-words'
  | 'book-creation-emotions'
  | 'book-creation-cvc'
  | 'book-creation-opposites'
  | 'book-creation-first-words'
  | 'book-creation-bedtime'
  | 'book-creation-general'
  | 'book-creation-digraphs'
  | 'book-creation-parent-education';

/**
 * Maps book types to specialized agent types
 */
export const BOOK_TYPE_TO_AGENT_TYPE: Record<string, AgentType> = {
  'numbers': 'book-creation-numbers',
  'rhyming': 'book-creation-rhyming',
  'colors': 'book-creation-colors',
  'abc': 'book-creation-abc',
  'shapes': 'book-creation-shapes',
  'animals': 'book-creation-animals',
  'sight-words': 'book-creation-sight-words',
  'emotions': 'book-creation-emotions',
  'cvc': 'book-creation-cvc',
  'opposites': 'book-creation-opposites',
  'first-words': 'book-creation-first-words',
  'bedtime': 'book-creation-bedtime',
  'general': 'book-creation-general',
  'digraphs': 'book-creation-digraphs',
  'parent-education': 'book-creation-parent-education',
  'other': 'book-creation'
} as const;

export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Agent type determining its specialized capabilities */
  type: AgentType;
  /** Description of the agent's purpose and goals */
  intent: string;
  /** Current operational status */
  status: string;
  /** System instructions that define agent behavior */
  instructions: string;
  /** AI provider (OpenAI, DeepSeek, or Google) */
  provider: AIProvider;
  /** AI model identifier */
  model: string;
  /** Maximum tokens the model can generate */
  max_completion_tokens: number;
  /** Nucleus sampling parameter (0.0 to 1.0) */
  top_p: number;
}

/**
 * Request interface for comparing two agent configurations
 * Used by the what_changed_in_agent edge function
 */
export interface CompareRequest {
  /** Previous agent configuration */
  originalConfig: AgentConfig;
  /** New agent configuration to compare against */
  newConfig: AgentConfig;
}