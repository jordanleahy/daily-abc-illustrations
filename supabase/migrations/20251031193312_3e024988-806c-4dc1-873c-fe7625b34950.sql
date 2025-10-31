-- Drop unused gemini-specific tables
-- These tables were created for the Google Chat integration but never used
-- All books (including Google Chat created books) are stored in the regular books table

DROP TABLE IF EXISTS public.gemini_page_images CASCADE;
DROP TABLE IF EXISTS public.gemini_pages CASCADE;
DROP TABLE IF EXISTS public.gemini_books CASCADE;

-- Note: Keep gemini_chat_sessions as it stores chat history and links to regular books via created_book_id