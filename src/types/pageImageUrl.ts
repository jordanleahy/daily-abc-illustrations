/**
 * Image record for a book page
 * All images are user-uploaded - no AI generation in this codebase
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
  /** Public URL of the uploaded image */
  image_url: string | null;
  /** Public URL of the black & white coloring version */
  coloring_image_url?: string | null;
  /** Public URL of the text overlay version */
  text_image_url?: string | null;
  /** Description/prompt associated with this image */
  prompt_used: string | null;
  /** Error message if generation failed */
  error_message: string | null;
  /** Whether this is the current active version */
  is_latest: boolean;
  /** Source of the image: AI generated or user uploaded */
  source_type: 'ai_generated' | 'user_uploaded';
  /** Text overlay configuration applied to this image */
  text_overlay_config?: any | null;
  /** Cost in cents for AI generation */
  generation_cost_cents?: number | null;
  /** Additional usage metadata from AI generation */
  usage_metadata?: Record<string, any> | null;
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