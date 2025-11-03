/**
 * Centralized status enums for consistent status tracking across the application
 * Single source of truth for all frontend status-related types
 * 
 * NOTE: ProcessStatus and PublicationStatus are mirrored in supabase/functions/_shared/types.ts
 * for edge functions. Edge functions cannot import from src/ due to Deno runtime.
 * Keep both files synchronized when making changes to these enums.
 */

/**
 * Process status enum for tracking operation states
 * Used across frontend components and backend edge functions
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
 * Generation status enum for AI content creation tracking
 * Replaces inconsistent string literals across the codebase
 */
export enum GenerationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  ERROR = 'error'
}

/**
 * Agent operational status enum
 */
export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PROCESSING = 'processing'
}

/**
 * Optimization status for SEO and content processing
 */
export enum OptimizationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  ERROR = 'error'
}