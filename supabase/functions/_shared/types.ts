/**
 * Shared types and utilities for Supabase Edge Functions
 * 
 * This file contains common types, enums, and utility functions used across
 * all edge functions to ensure consistency and reduce code duplication.
 * 
 * NOTE: ProcessStatus enum is duplicated in src/types/process.ts for frontend use.
 * Keep both enums synchronized when making changes.
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
 * AI provider types
 */
export type AIProvider = 'openai' | 'deepseek';

/**
 * Agent configuration structure for edge functions
 * Represents a configured AI agent with its behavior and model settings
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Agent type determining its specialized capabilities */
  type: 'chat' | 'book-creation' | 'illustration-director' | 'graphic-designer';
  /** Description of the agent's purpose and goals */
  intent: string;
  /** Current operational status */
  status: string;
  /** System instructions that define agent behavior */
  instructions: string;
  /** AI provider (OpenAI or DeepSeek) */
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