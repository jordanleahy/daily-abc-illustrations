/**
 * Image generation record for a book page
 * Tracks the lifecycle of AI-generated images from prompt to completion
 */
export interface PageImageUrl {
  /** Unique identifier for this image record */
  id: string;
  /** ID of the page this image belongs to */
  page_id: string;
  /** ID of the book containing this page */
  book_id: string;
  /** ID of the user who owns this image */
  user_id: string;
  /** Version number for image iterations (1, 2, 3, etc.) */
  version_number: number;
  /** Public URL of the generated image (null while generating) */
  image_url: string | null;
  /** Current status of the image generation process */
  generation_status: 'not_started' | 'in_progress' | 'complete' | 'error';
  /** ISO timestamp when generation began */
  generation_started_at: string | null;
  /** ISO timestamp when generation completed */
  generation_completed_at: string | null;
  /** Time taken to generate the image in milliseconds */
  generation_duration_ms: number | null;
  /** AI prompt used to generate this image */
  prompt_used: string | null;
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
 * Type alias for PageImageUrl when used in version history contexts
 * Provides semantic clarity for version management operations
 */
export interface PageImageUrlVersion extends PageImageUrl {
  // Same as PageImageUrl, used for version history
}