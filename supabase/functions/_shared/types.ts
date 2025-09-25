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
 * @deprecated Import from frontend shared types instead
 * ProcessStatus enum - use consistent frontend definition
 */
export enum ProcessStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress', 
  COMPLETE = 'complete',
  ERROR = 'error',
  WARNING = 'warning',
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
 * @deprecated Import from frontend shared types instead
 * Publication status enum - use consistent frontend definition
 */
export enum PublicationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * @deprecated Use AgentConfigBackend from frontend shared types instead
 * Agent configuration interface for edge function operations
 */
export interface AgentConfig {
  id: string;
  name: string;
  type: 'chat' | 'book-creation' | 'illustration-director' | 'graphic-designer';
  intent: string;
  status: 'online' | 'offline' | 'processing';
  instructions: string;
  modelSettings: {
    model: string;
    maxCompletionTokens: number;
    topP: number;
  };
}

/**
 * @deprecated Use CompareAgentRequest from frontend shared types instead
 * Request interface for comparing two agent configurations
 */
export interface CompareRequest {
  originalConfig: AgentConfig;
  newConfig: AgentConfig;
}