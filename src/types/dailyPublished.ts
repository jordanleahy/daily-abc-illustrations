export type DailyPublishedStatus = 'queued' | 'active' | 'expired';

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
  queue_position: number;
  status: DailyPublishedStatus;
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
}