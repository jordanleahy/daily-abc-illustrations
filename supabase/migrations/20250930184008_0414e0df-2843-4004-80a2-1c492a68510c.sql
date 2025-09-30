-- Add is_highlighted column to books table
ALTER TABLE public.books 
ADD COLUMN is_highlighted boolean NOT NULL DEFAULT false;

-- Create index for efficient filtering of highlighted books
CREATE INDEX idx_books_is_highlighted ON public.books(is_highlighted) WHERE is_highlighted = true;

-- Add comment for documentation
COMMENT ON COLUMN public.books.is_highlighted IS 'Indicates if the book is featured/highlighted on the landing page';