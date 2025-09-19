/**
 * Simplified prompt configuration for individual book pages
 * Contains distilled AI instructions optimized for image generation
 */
export interface PageSimplifiedPrompt {
  /** Unique identifier for this simplified prompt */
  id: string;
  /** ID of the page this prompt applies to */
  page_id: string;
  /** ID of the book containing this page */
  book_id: string;
  /** ID of the user who owns this prompt */
  user_id: string;
  /** The simplified, distilled prompt content optimized for image generation */
  simplified_content: string;
  /** ID of the source system prompt this was distilled from */
  source_prompt_id: string | null;
  /** Version number for prompt iterations (1, 2, 3, etc.) */
  version_number: number;
  /** Current status of the generation process */
  generation_status: 'not_started' | 'in_progress' | 'complete' | 'error';
  /** ISO timestamp when generation began */
  generation_started_at: string | null;
  /** ISO timestamp when generation completed */
  generation_completed_at: string | null;
  /** Time taken to generate the simplified prompt in milliseconds */
  generation_duration_ms: number | null;
  /** Error message if generation failed */
  error_message: string | null;
  /** Whether this is the current latest version */
  is_latest: boolean;
  /** ISO timestamp when the prompt was created */
  created_at: string;
  /** ISO timestamp when the prompt was last modified */
  updated_at: string;
}

/**
 * Type alias for PageSimplifiedPrompt when used in version history contexts
 * Provides semantic clarity for version management operations
 */
export interface PageSimplifiedPromptVersion extends PageSimplifiedPrompt {
  // Same as PageSimplifiedPrompt, used for version history
}