/**
 * Shared types for Supabase Edge Functions
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