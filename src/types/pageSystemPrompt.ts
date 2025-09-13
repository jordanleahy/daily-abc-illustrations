export interface PageSystemPrompt {
  id: string;
  page_id: string;
  book_id: string;
  user_id: string;
  content: string;
  version_number: number;
  is_latest: boolean;
  is_deployed: boolean;
  deployed_at: string | null;
  source_type: string; // 'manual' | 'generated' but allow database flexibility
  generation_metadata: any;
  created_at: string;
  updated_at: string;
}

export interface PageSystemPromptVersion extends PageSystemPrompt {
  // Same as PageSystemPrompt, used for version history
}