/**
 * Process status enum for frontend components
 * 
 * NOTE: This enum is duplicated in supabase/functions/_shared/types.ts for edge functions.
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