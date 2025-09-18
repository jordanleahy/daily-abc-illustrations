/**
 * ==================================================================================
 * BOOK THUMBNAIL TYPE DEFINITIONS
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * Defines the complete data structure for book thumbnail generation and management.
 * This system supports AI-generated social media thumbnails with full version control,
 * progress tracking, and error handling capabilities.
 * 
 * KEY BUSINESS FEATURES:
 * - Version Control: Multiple thumbnails per book with semantic versioning
 * - Progress Tracking: Real-time generation status monitoring
 * - Error Recovery: Detailed error messages for debugging and user feedback
 * - Performance Metrics: Duration tracking for optimization and cost analysis
 * - Quality Assurance: Aspect ratio enforcement for platform compatibility
 * 
 * DATABASE INTEGRATION:
 * - Maps directly to 'book_thumbnails' Supabase table
 * - Enforces referential integrity with books and users
 * - Supports efficient querying via indexed fields
 * - Compatible with Row Level Security (RLS) policies
 * 
 * LIFECYCLE STATES:
 * 1. not_started → Record created, awaiting generation
 * 2. in_progress → AI generation in process
 * 3. complete → Successfully generated and stored
 * 4. error → Generation failed with error details
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Nullable fields reduce storage overhead during generation
 * - Indexed fields support efficient querying
 * - Version tracking enables A/B testing and rollback
 * - Duration metrics support cost optimization
 * ==================================================================================
 */

/**
 * Book thumbnail generation record
 * Tracks the lifecycle of AI-generated book cover thumbnails from prompt to completion
 */
export interface BookThumbnail {
  /** Unique identifier for this thumbnail record */
  id: string;
  /** ID of the book this thumbnail belongs to */
  book_id: string;
  /** ID of the user who owns this thumbnail */
  user_id: string;
  /** Version number for thumbnail iterations (1, 2, 3, etc.) */
  version_number: number;
  /** Public URL of the generated thumbnail (null while generating) */
  thumbnail_url: string | null;
  /** AI prompt used to generate this thumbnail */
  prompt_used: string | null;
  /** Current status of the thumbnail generation process */
  generation_status: 'not_started' | 'in_progress' | 'complete' | 'error';
  /** ISO timestamp when generation began */
  generation_started_at: string | null;
  /** ISO timestamp when generation completed */
  generation_completed_at: string | null;
  /** Time taken to generate the thumbnail in milliseconds */
  generation_duration_ms: number | null;
  /** Aspect ratio of the thumbnail (always 1200:630 for book thumbnails) */
  aspect_ratio: string;
  /** Error message if generation failed */
  error_message: string | null;
  /** Whether this is the current active version */
  is_latest: boolean;
  /** ISO timestamp when the record was created */
  created_at: string;
  /** ISO timestamp when the record was last modified */
  updated_at: string;
}

/**
 * Type alias for BookThumbnail when used in version history contexts
 * Provides semantic clarity for version management operations
 */
export interface BookThumbnailVersion extends BookThumbnail {
  // Same as BookThumbnail, used for version history
}