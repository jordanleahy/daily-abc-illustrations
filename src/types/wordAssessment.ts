export interface WordAssessment {
  id: string;
  parent_user_id: string;
  kid_profile_id: string;
  book_id: string;
  page_id: string;
  word: string;
  word_index: number;
  knows_word: boolean;
  assessed_at: string;
  created_at: string;
}

export interface ExtractedWord {
  word: string;
  index: number;
}
