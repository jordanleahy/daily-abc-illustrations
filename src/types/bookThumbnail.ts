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