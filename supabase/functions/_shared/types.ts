/**
 * Shared types and utilities for Supabase Edge Functions
 * 
 * NOTE: This enum is duplicated in src/types/process.ts for frontend use.
 * Keep both enums synchronized when making changes.
 */

export enum ProcessStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress', 
  COMPLETE = 'complete',
  ERROR = 'error',
  WARNING = 'warning',
  SKIPPED = 'skipped'
}

// CORS headers used by all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Structured logging function for edge functions
export const log = (level: string, status: ProcessStatus, step: string, message: string, extra?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${status}] [${step}] - ${message}`;
  console.log(logMessage, extra ? JSON.stringify(extra, null, 2) : '');
  return timestamp;
};

// Request ID generator for tracking
export const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// OpenAI model helper for parameter handling
export const isLegacyModel = (model: string) => model === 'gpt-4o' || model === 'gpt-4o-mini';

// Agent configuration interfaces
export interface AgentConfig {
  name: string;
  type: 'chat' | 'assistant';
  intent: string;
  status: 'online' | 'offline' | 'processing';
  instructions: string;
  modelSettings: {
    model: string;
    maxCompletionTokens: number;
    topP: number;
  };
}

export interface CompareRequest {
  originalConfig: AgentConfig;
  newConfig: AgentConfig;
}