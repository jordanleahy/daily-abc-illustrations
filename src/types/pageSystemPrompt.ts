/**
 * System prompt configuration for individual book pages
 * Contains AI instructions for generating page-specific content like image prompts
 */

export interface GenerationMetadata {
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  generation_time_ms?: number;
  request_id?: string;
  error_message?: string;
  [key: string]: unknown; // Allow additional metadata fields
}

export interface PageSystemPrompt {
  /** Unique identifier for this system prompt */
  id: string;
  /** ID of the page this prompt applies to */
  page_id: string;
  /** ID of the book containing this page */
  book_id: string;
  /** ID of the user who owns this prompt */
  user_id: string;
  /** The actual system prompt content/instructions */
  content: string;
  /** Version number for prompt iterations (1, 2, 3, etc.) */
  version_number: number;
  /** Whether this is the current latest version */
  is_latest: boolean;
  /** Whether this version is actively deployed for use */
  is_deployed: boolean;
  /** ISO timestamp when this version was deployed */
  deployed_at: string | null;
  /** How the prompt was created ('manual' | 'image_generation' | etc.) */
  source_type: string; // Allow database flexibility for new types
  /** Additional metadata about prompt generation */
  generation_metadata: GenerationMetadata | null;
  /** Current status of the prompt ('complete' | 'processing' | 'error') */
  prompt_status?: string;
  /** ISO timestamp when the prompt was created */
  created_at: string;
  /** ISO timestamp when the prompt was last modified */
  updated_at: string;
}

/**
 * Type alias for PageSystemPrompt when used in version history contexts
 * Provides semantic clarity for version management operations
 */
export interface PageSystemPromptVersion extends PageSystemPrompt {
  // Same as PageSystemPrompt, used for version history
}