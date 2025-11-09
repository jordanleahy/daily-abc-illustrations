-- Phase 0.1: SEO Metadata Schema Updates
-- Make seo_metadata.daily_published_id optional and add book_id support

-- Step 1: Make daily_published_id nullable (allow book-only SEO)
ALTER TABLE public.seo_metadata 
ALTER COLUMN daily_published_id DROP NOT NULL;

-- Step 2: Add book_id column for direct book SEO reference
ALTER TABLE public.seo_metadata 
ADD COLUMN book_id UUID REFERENCES public.books(id) ON DELETE CASCADE;

-- Step 3: Add performance indexes
CREATE INDEX idx_seo_metadata_book_id ON public.seo_metadata(book_id);
CREATE INDEX idx_seo_metadata_book_latest ON public.seo_metadata(book_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_seo_metadata_daily_published_latest ON public.seo_metadata(daily_published_id, is_latest) WHERE is_latest = true;

-- Step 4: Add check constraint to ensure at least one reference exists
ALTER TABLE public.seo_metadata
ADD CONSTRAINT seo_metadata_reference_check 
CHECK (book_id IS NOT NULL OR daily_published_id IS NOT NULL);

-- Step 5: Add column comments for documentation
COMMENT ON COLUMN public.seo_metadata.book_id IS 'Direct reference to book (for library SEO)';
COMMENT ON COLUMN public.seo_metadata.daily_published_id IS 'Optional reference to daily published entry (for homepage rotation SEO)';

-- Step 6: Update RLS policies to support book_id queries
-- Allow users to view SEO metadata for their own books
CREATE POLICY "Users can view SEO for their own books"
ON public.seo_metadata
FOR SELECT
USING (
  book_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.books 
    WHERE books.id = seo_metadata.book_id 
    AND books.user_id = auth.uid()
  )
);

-- Allow users to create SEO metadata for their own books
CREATE POLICY "Users can create SEO for their own books"
ON public.seo_metadata
FOR INSERT
WITH CHECK (
  book_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.books 
    WHERE books.id = seo_metadata.book_id 
    AND books.user_id = auth.uid()
  )
);

-- Allow users to update SEO metadata for their own books
CREATE POLICY "Users can update SEO for their own books"
ON public.seo_metadata
FOR UPDATE
USING (
  book_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.books 
    WHERE books.id = seo_metadata.book_id 
    AND books.user_id = auth.uid()
  )
);