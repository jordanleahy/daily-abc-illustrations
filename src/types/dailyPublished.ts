export type DailyPublishedStatus = 'draft' | 'queued' | 'active' | 'expired';

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
  qr_code_config?: any;
  qr_code_generated_at?: string;
}

export interface DailyPublishedWithBook extends DailyPublished {
  book: {
    book_name: string;
    book_description?: string;
    user_id: string;
  };
}

export interface CreateDailyPublishedRequest {
  book_id: string;
  title: string;
  description?: string;
  publish_date?: string; // Allow scheduling for specific dates
}