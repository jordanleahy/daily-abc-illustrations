-- Create the publication_status enum type
CREATE TYPE public.publication_status AS ENUM ('draft', 'published', 'archived');

-- Add the status column to the books table with a default value
ALTER TABLE public.books 
ADD COLUMN status public.publication_status NOT NULL DEFAULT 'draft';

-- Add an index for better query performance on status
CREATE INDEX idx_books_status ON public.books(status);

-- Add an index for common queries (user + status)
CREATE INDEX idx_books_user_status ON public.books(user_id, status);