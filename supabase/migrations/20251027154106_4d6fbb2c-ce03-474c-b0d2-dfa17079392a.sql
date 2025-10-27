-- Step 1: Clean up orphaned records in page_image_urls
-- Delete any image records where the page_id no longer exists
DELETE FROM public.page_image_urls
WHERE page_id NOT IN (SELECT id FROM public.pages);

-- Delete any image records where the book_id no longer exists
DELETE FROM public.page_image_urls
WHERE book_id NOT IN (SELECT id FROM public.books);

-- Step 2: Add missing foreign key constraint with CASCADE DELETE for page_id
ALTER TABLE public.page_image_urls 
ADD CONSTRAINT page_image_urls_page_id_fkey 
FOREIGN KEY (page_id) 
REFERENCES public.pages(id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_page_image_urls_page_id 
ON public.page_image_urls(page_id);

-- Step 3: Add book_id foreign key for data consistency
ALTER TABLE public.page_image_urls 
ADD CONSTRAINT page_image_urls_book_id_fkey 
FOREIGN KEY (book_id) 
REFERENCES public.books(id) 
ON DELETE CASCADE;

-- Add index for book_id lookups
CREATE INDEX IF NOT EXISTS idx_page_image_urls_book_id 
ON public.page_image_urls(book_id);