-- Add tags column to books table for manual categorization
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.books.tags IS 'Manual tags for book organization and categorization';

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_books_tags ON public.books USING GIN(tags);