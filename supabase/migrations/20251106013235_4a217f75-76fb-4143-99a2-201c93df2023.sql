-- Extend user_book_activity table to support tracking both daily_published books and user's own books
-- This allows unified activity tracking across Library and Books pages

-- Add book_id column (nullable, since existing records only have daily_published_id)
ALTER TABLE public.user_book_activity 
ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES public.books(id) ON DELETE CASCADE;

-- Make daily_published_id nullable to allow tracking books that aren't published
ALTER TABLE public.user_book_activity 
ALTER COLUMN daily_published_id DROP NOT NULL;

-- Add check constraint to ensure at least one ID is provided
ALTER TABLE public.user_book_activity
ADD CONSTRAINT user_book_activity_id_check 
CHECK (daily_published_id IS NOT NULL OR book_id IS NOT NULL);

-- Drop the old unique constraint
ALTER TABLE public.user_book_activity
DROP CONSTRAINT IF EXISTS user_book_activity_user_id_daily_published_id_key;

-- Add new unique constraints that handle both tracking types
-- Note: Can't have both book_id and daily_published_id in same record
CREATE UNIQUE INDEX IF NOT EXISTS user_book_activity_user_daily_published 
ON public.user_book_activity(user_id, daily_published_id) 
WHERE daily_published_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_book_activity_user_book 
ON public.user_book_activity(user_id, book_id) 
WHERE book_id IS NOT NULL;

-- Create index for efficient book_id lookups
CREATE INDEX IF NOT EXISTS idx_user_book_activity_book_id 
ON public.user_book_activity(book_id) 
WHERE book_id IS NOT NULL;

-- Comment explaining the table structure
COMMENT ON TABLE public.user_book_activity IS 
'Tracks user activity for books. Can track either daily_published books (library) or user-created books.
- daily_published_id: For library book views
- book_id: For user''s own book editing activity
At least one ID must be present, but not both.';