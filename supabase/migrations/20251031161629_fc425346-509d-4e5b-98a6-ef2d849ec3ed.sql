-- Add created_book_id column to gemini_chat_sessions to track which book was created from this chat
ALTER TABLE gemini_chat_sessions 
ADD COLUMN created_book_id uuid REFERENCES gemini_books(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_gemini_chat_sessions_created_book_id 
ON gemini_chat_sessions(created_book_id);