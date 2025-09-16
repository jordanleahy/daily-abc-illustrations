export interface InstagramShared {
  id: string;
  book_id: string;
  title: string;
  description?: string;
  shared_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInstagramSharedRequest {
  book_id: string;
  title: string;
  description?: string;
}