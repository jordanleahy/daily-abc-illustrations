-- Add chat_session_id to books table for traceability
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS chat_session_id UUID REFERENCES public.gemini_chat_sessions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_books_chat_session_id ON public.books(chat_session_id);

-- Add comment for documentation
COMMENT ON COLUMN public.books.chat_session_id IS 'Reference to the chat session that created this book, for prompt traceability';