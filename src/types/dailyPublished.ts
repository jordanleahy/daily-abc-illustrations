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
}

export interface CreateDailyPublishedRequest {
  book_id: string;
  title: string;
  description?: string;
}