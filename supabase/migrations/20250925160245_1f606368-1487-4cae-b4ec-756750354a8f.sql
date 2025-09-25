-- Add RLS policies for teachers to access all books and related data
-- This allows teachers to view all books, not just their own

-- Allow teachers to view all books
CREATE POLICY "Teachers can view all books" 
ON public.books 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all pages for any book
CREATE POLICY "Teachers can view all pages" 
ON public.pages 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all page images
CREATE POLICY "Teachers can view all page images" 
ON public.page_image_urls 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all book system prompts
CREATE POLICY "Teachers can view all book system prompts" 
ON public.book_system_prompts 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all page system prompts
CREATE POLICY "Teachers can view all page system prompts" 
ON public.page_system_prompts 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Allow teachers to view all SEO metadata
CREATE POLICY "Teachers can view all SEO metadata" 
ON public.seo_metadata 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));