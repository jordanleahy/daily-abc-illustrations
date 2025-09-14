export interface PageImageUrl {
  id: string;
  page_id: string;
  book_id: string;
  user_id: string;
  version_number: number;
  image_url: string | null;
  generation_status: 'not_started' | 'in_progress' | 'complete' | 'error';
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_duration_ms: number | null;
  prompt_used: string | null;
  error_message: string | null;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageImageUrlVersion extends PageImageUrl {
  // Same as PageImageUrl, used for version history
}