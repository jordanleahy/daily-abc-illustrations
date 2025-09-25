-- Add teacher access policies for daily_published table
CREATE POLICY "Teachers can view all daily published content" 
ON public.daily_published 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Add teacher access policies for pages table  
CREATE POLICY "Teachers can view pages for all daily published books" 
ON public.pages 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
  SELECT 1 FROM daily_published dp 
  WHERE dp.book_id = pages.book_id
));

-- Add teacher access policies for page_image_urls table
CREATE POLICY "Teachers can view images for all daily published books"
ON public.page_image_urls
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
  SELECT 1 FROM pages p 
  JOIN daily_published dp ON dp.book_id = p.book_id
  WHERE p.id = page_image_urls.page_id
));

-- Create teacher role enum value if it doesn't exist
-- First check if teacher role exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'teacher';
    END IF;
END
$$;