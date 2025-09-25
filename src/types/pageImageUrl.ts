import { BaseEntity, VersionTracked, WithVersionHistory, Nullable } from '@/types/shared/base';
import { GenerationStatus } from '@/types/shared/status';

/**
 * Source type for page images
 */
export type ImageSourceType = 'ai_generated' | 'user_uploaded';

/**
 * Image generation record for a book page
 * Tracks the lifecycle of AI-generated images from prompt to completion
 */
export interface PageImageUrl extends BaseEntity, VersionTracked {
  /** ID of the page this image belongs to */
  page_id: string;
  /** ID of the book containing this page */
  book_id: string;
  /** Public URL of the generated image (null while generating) */
  image_url: string | null;
  /** Current status of the image generation process */
  generation_status: GenerationStatus;
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
  /** Source of the image: AI generated or user uploaded */
  source_type: ImageSourceType;
}

/**
 * Type alias for PageImageUrl when used in version history contexts
 * @deprecated Use WithVersionHistory<PageImageUrl> instead
 */
export type PageImageUrlVersion = WithVersionHistory<PageImageUrl>;