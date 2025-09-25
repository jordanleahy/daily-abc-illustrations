import { BaseEntity, VersionTracked, DeploymentTracked, WithVersionHistory } from '@/types/shared/base';
import { GenerationStatus } from '@/types/shared/status';

/**
 * System prompt configuration for individual book pages
 * Contains AI instructions for generating page-specific content like image prompts
 */
export interface PageSystemPrompt extends BaseEntity, VersionTracked, DeploymentTracked {
  /** ID of the page this prompt applies to */
  page_id: string;
  /** ID of the book containing this page */
  book_id: string;
  /** The actual system prompt content/instructions */
  content: string;
  /** How the prompt was created ('manual' | 'image_generation' | etc.) */
  source_type: string; // Allow database flexibility for new types
  /** Additional metadata about prompt generation */
  generation_metadata: any;
  /** Current status of the prompt */
  prompt_status?: GenerationStatus;
}

/**
 * Type alias for PageSystemPrompt when used in version history contexts
 * @deprecated Use WithVersionHistory<PageSystemPrompt> instead
 */
export type PageSystemPromptVersion = WithVersionHistory<PageSystemPrompt>;