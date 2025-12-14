export type DailyPublishedStatus = 'draft' | 'queued' | 'active' | 'expired';

export interface QRCodeConfig {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
  includeMargin?: boolean;
}

export interface DailyPublished {
  id: string;
  book_id: string;
  title: string;
  description?: string;
  published_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  queue_position?: number; // Made optional since we're not using it anymore
  status: DailyPublishedStatus;
  publish_date: string; // New date-based field
  qr_code_image?: string;
  qr_code_public_url?: string;
  qr_code_config?: QRCodeConfig;
  qr_code_generated_at?: string;
  slug?: string;
  // Simple queue ordering
  queue_order?: number;
}

export interface DailyPublishedWithBook extends DailyPublished {
  book: {
    book_name: string;
    book_description?: string;
    user_id: string;
    created_at: string;
  };
  og_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  last_viewed_at?: string | null;
  view_count?: number;
}

export interface DailyPublishedWithTotalPages extends DailyPublished {
  book?: {
    total_pages: number;
  };
}

export interface CreateDailyPublishedRequest {
  book_id: string;
  title: string;
  description?: string;
  queue_order?: number; // Simple queue position
}

// Unified resolved public book from resolve_public_book_by_slug RPC
export interface ResolvedPublicBook {
  id: string;
  book_id: string;
  title: string;
  description: string | null;
  source_type: 'daily_published' | 'marketing';
  book_name: string;
  book_description: string | null;
  user_id: string;
  total_pages: number | null;
  book_created_at: string;
}