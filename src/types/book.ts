export interface Book {
  id: string;
  user_id: string;
  book_name: string;
  category?: string;
  book_description?: string;
  total_pages: number;
  is_published: boolean;
  current_system_prompt_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  book_id: string;
  letter: string;
  page_number: number;
  title: string;
  description?: string;
  content: {
    mainConcept: string;
    funFact: string;
    activity: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BookWithPages extends Book {
  pages: Page[];
}